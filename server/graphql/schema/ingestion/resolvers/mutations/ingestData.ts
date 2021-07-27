import {
    IngestDataInput, IngestDataResult, MutationIngestDataArgs,
    IngestSubjectInput, IngestItemInput, IngestIdentifierInput, User,
    IngestPhotogrammetryInput, IngestModelInput, IngestSceneInput, IngestOtherInput
} from '../../../../../types/graphql';
import { ResolverBase, IWorkflowHelper } from '../../../ResolverBase';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import * as COL from '../../../../../collections/interface';
import * as LOG from '../../../../../utils/logger';
import * as H from '../../../../../utils/helpers';
import { SvxReader, SvxExtraction } from '../../../../../utils/parser';
import * as WF from '../../../../../workflow/interface';
import * as REP from '../../../../../report/interface';
import { AssetStorageAdapter, IngestAssetInput, IngestAssetResult, OperationInfo, ReadStreamResult } from '../../../../../storage/interface';
import { VocabularyCache, eVocabularyID } from '../../../../../cache';
import { JobCookSIPackratInspectOutput } from '../../../../../job/impl/Cook';
import { RouteBuilder, eHrefMode } from '../../../../../http/routes/routeBuilder';

type AssetPair = {
    asset: DBAPI.Asset;
    assetVersion: DBAPI.AssetVersion | undefined;
};

export default async function ingestData(_: Parent, args: MutationIngestDataArgs, context: Context): Promise<IngestDataResult> {
    const { input } = args;
    const { user } = context;
    const ingestDataWorker: IngestDataWorker = new IngestDataWorker(input, user);
    return await ingestDataWorker.ingest();
}

class IngestDataWorker extends ResolverBase {
    private input: IngestDataInput;
    private user: User | undefined;
    private vocabularyARK: DBAPI.Vocabulary | undefined = undefined;

    private ingestPhotogrammetry: boolean = false;
    private ingestModel: boolean = false;
    private ingestScene: boolean = false;
    private ingestOther: boolean = false;
    private ingestNew: boolean = false;
    private ingestUpdate: boolean = false;
    private assetVersionSet: Set<number> = new Set<number>(); // set of idAssetVersions

    private assetVersionMap: Map<number, DBAPI.SystemObjectBased> = new Map<number, DBAPI.SystemObjectBased>();       // map from idAssetVersion -> object that "owns" the asset -- populated during creation of asset-owning objects below
    private ingestPhotoMap: Map<number, IngestPhotogrammetryInput> = new Map<number, IngestPhotogrammetryInput>();    // map from idAssetVersion -> photogrammetry input

    constructor(input: IngestDataInput, user: User | undefined) {
        super();
        this.input = input;
        this.user = user;
    }

    async ingest(): Promise<IngestDataResult> {
        const IDR: IngestDataResult = await this.ingestWorker();

        if (this.workflowHelper?.workflow)
            await this.workflowHelper.workflow.updateStatus(IDR.success ? DBAPI.eWorkflowJobRunStatus.eDone : DBAPI.eWorkflowJobRunStatus.eError);

        if (IDR.success)
            await this.appendToWFReport('<b>Ingest validation succeeded</b>');
        else
            await this.appendToWFReport(`<b>Ingest validation failed</b>: ${IDR.message}`);
        return IDR;
    }

    private async ingestWorker(): Promise<IngestDataResult> {
        LOG.info(`ingestData: input=${JSON.stringify(this.input, H.Helpers.saferStringify)}`, LOG.LS.eGQL);

        const results: H.IOResults = this.validateInput();
        this.workflowHelper = await this.createWorkflow(); // do this *after* this.validateInput, and *before* returning from validation failure
        if (!results.success)
            return results;

        let itemDB: DBAPI.Item | null = null;
        if (this.ingestNew) {
            await this.appendToWFReport('Ingesting content for new object');

            // retrieve/create subjects; if creating subjects, create related objects (Identifiers, possibly UnitEdan records, though unlikely)
            const subjectsDB: DBAPI.Subject[] = [];
            for (const subject of this.input.subjects) {
                // fetch our understanding of EDAN's unit information:
                const units: DBAPI.Unit[] | null = await DBAPI.Unit.fetchFromNameSearch(subject.unit);
                let subjectDB: DBAPI.Subject | null = null;

                if (subject.id)     // if this subject exists, validate it
                    subjectDB = await this.validateExistingSubject(subject, units);
                else                // otherwise create it and related objects, including possibly units
                    subjectDB = await this.createSubjectAndRelated(subject, units);

                if (!subjectDB)
                    return { success: false, message: 'failure to retrieve or create subject' };

                subjectsDB.push(subjectDB);
            }

            // wire projects to subjects
            if (this.input.project.id && !(await this.wireProjectToSubjects(this.input.project.id, subjectsDB)))
                return { success: false, message: 'failure to wire project to subjects' };
            await this.appendToWFReport(`Packrat Project: ${this.input.project.name}`);

            itemDB = await this.fetchOrCreateItem(this.input.item);
            if (!itemDB)
                return { success: false, message: 'failure to retrieve or create item' };
            await this.appendToWFReport(`Packrat Item: ${itemDB.Name}`);

            // wire subjects to item
            if (!await this.wireSubjectsToItem(subjectsDB, itemDB))
                return { success: false, message: 'failure to wire subjects to item' };
        } else
            await this.appendToWFReport('Ingesting content for updated object');

        if (this.ingestPhotogrammetry) {
            for (const photogrammetry of this.input.photogrammetry) {
                if (!await this.createPhotogrammetryObjects(photogrammetry))
                    return { success: false, message: 'failure to create photogrammetry object' };
            }
        }

        if (this.ingestModel) {
            for (const model of this.input.model) {
                if (!await this.createModelObjects(model))
                    return { success: false, message: 'failure to create model object' };
            }
        }

        let modelTransformUpdated: boolean = false;
        if (this.ingestScene) {
            for (const scene of this.input.scene) {
                const { success, transformUpdated } = await this.createSceneObjects(scene);
                if (!success)
                    return { success: false, message: 'failure to create scene object' };
                if (transformUpdated)
                    modelTransformUpdated = true;
            }
        }

        if (this.ingestOther) {
            for (const other of this.input.other) {
                if (!await this.createOtherObjects(other))
                    return { success: false, message: 'failure to create other object' };
            }
        }

        // wire item to asset-owning objects
        if (itemDB) {
            if (!await this.wireItemToAssetOwners(itemDB))
                return { success: false, message: 'failure to wire item to asset owner' };
        }

        // next, promote asset into repository storage
        const { ingestResMap, transformUpdated } = await this.promoteAssetsIntoRepository();
        if (transformUpdated)
            modelTransformUpdated = true;

        // use results to create/update derived objects
        if (this.ingestPhotogrammetry)
            await this.createPhotogrammetryDerivedObjects(ingestResMap);

        // notify workflow engine about this ingestion:
        if (!await this.sendWorkflowIngestionEvent(ingestResMap, modelTransformUpdated))
            return { success: false, message: 'failure to notify workflow engine about ingestion event' };
        return { success: true };
    }

    private async getVocabularyARK(): Promise<DBAPI.Vocabulary | undefined> {
        if (!this.vocabularyARK) {
            this.vocabularyARK = await VocabularyCache.vocabularyByEnum(eVocabularyID.eIdentifierIdentifierTypeARK);
            if (!this.vocabularyARK) {
                LOG.error('ingestData unable to fetch vocabulary for ARK Identifiers', LOG.LS.eGQL);
                return undefined;
            }
        }
        return this.vocabularyARK;
    }

    private async handleIdentifiers(soBased: DBAPI.SystemObjectBased, systemCreated: boolean,
        identifiers: IngestIdentifierInput[] | undefined): Promise<boolean> {
        if (systemCreated) {
            if (!await this.createIdentifierForObject(null, soBased)) {
                LOG.error(`ingestData unable to create identifier for ${JSON.stringify(soBased)}`, LOG.LS.eGQL);
                return false;
            }
        }

        if (identifiers && identifiers.length > 0) {
            for (const identifier of identifiers) {
                if (!await this.createIdentifierForObject(identifier, soBased)) {
                    LOG.error(`ingestData unable to create identifier for ${JSON.stringify(soBased)}`, LOG.LS.eGQL);
                    return false;
                }
            }
        }

        return true;
    }

    private async createIdentifierForObject(identifier: IngestIdentifierInput | null, SOBased: DBAPI.SystemObjectBased): Promise<boolean> {
        const SO: DBAPI.SystemObject | null = await SOBased.fetchSystemObject();
        if (!SO) {
            LOG.error(`ingestData unable to fetch system object from ${JSON.stringify(SOBased)}`, LOG.LS.eGQL);
            return false;
        }

        const ICOL: COL.ICollection = COL.CollectionFactory.getInstance();

        if (!identifier) {
            // create system identifier when needed
            const arkId: string = ICOL.generateArk(null, false);
            const identifierSystemDB: DBAPI.Identifier | null = await this.createIdentifier(arkId, SO, null, true);
            if (!identifierSystemDB) {
                LOG.error(`ingestData unable to create identifier record for object ${JSON.stringify(SOBased)}`, LOG.LS.eGQL);
                return false;
            } else
                return true;
        } else { // use identifier provided by user
            // compute identifier; for ARKs, extract the ID from a URL that may be housing the ARK ID
            const vocabularyARK: DBAPI.Vocabulary | undefined = await this.getVocabularyARK();
            if (!vocabularyARK)
                return false;
            let IdentifierValue: string;
            if (identifier.identifierType == vocabularyARK.idVocabulary) {
                const arkId: string | null = ICOL.extractArkFromUrl(identifier.identifier);
                if (!arkId) {
                    LOG.error(`ingestData asked to create an ark indentifier with invalid ark ${identifier.identifier} no value for ${JSON.stringify(SOBased)}`, LOG.LS.eGQL);
                    return false;
                } else
                    IdentifierValue = arkId;
            } else
                IdentifierValue = identifier.identifier;

            if (!IdentifierValue) {
                LOG.error(`ingestData asked to create an indentifier with no value for ${JSON.stringify(SOBased)}`, LOG.LS.eGQL);
                return false;
            }

            const identifierDB: DBAPI.Identifier | null = await this.createIdentifier(IdentifierValue, SO, identifier.identifierType, false);
            if (!identifierDB)
                return false;
        }
        return true;
    }

    private async createIdentifier(identifierValue: string, SO: DBAPI.SystemObject | null,
        idVIdentifierType: number | null, systemGenerated: boolean): Promise<DBAPI.Identifier | null> {
        if (!idVIdentifierType) {
            const vocabularyARK: DBAPI.Vocabulary | undefined = await this.getVocabularyARK();
            if (!vocabularyARK)
                return null;
            idVIdentifierType = vocabularyARK.idVocabulary;
        }

        const identifier: DBAPI.Identifier = new DBAPI.Identifier({
            IdentifierValue: identifierValue,
            idVIdentifierType,
            idSystemObject: SO ? SO.idSystemObject : null,
            idIdentifier: 0
        });

        if (!await identifier.create()) {
            const error: string = `ingestData unable to create identifier record for subject's identifier ${identifierValue}`;
            await this.appendToWFReport(`Identifier: ${identifierValue} (${systemGenerated ? 'system generated' : 'user-supplied'}) <b>creation failed</b>`);
            LOG.error(error, LOG.LS.eGQL);
            return null;
        }
        await this.appendToWFReport(`Identifier: ${identifierValue} (${systemGenerated ? 'system generated' : 'user-supplied'})`);
        return identifier;
    }

    private async validateOrCreateUnitEdan(units: DBAPI.Unit[] | null, Abbreviation: string): Promise<DBAPI.Unit | null> {
        if (!units || units.length == 0) {
            const unitEdanDB = new DBAPI.UnitEdan({
                idUnit: 1, // hard-coded for the 'Unknown Unit'
                Abbreviation,
                idUnitEdan: 0
            });
            if (!await unitEdanDB.create()) {
                LOG.error(`ingestData unable to create unitEdan record for subject's unit ${Abbreviation}`, LOG.LS.eGQL);
                return null;
            }
            return await DBAPI.Unit.fetch(1);
        }

        return units[0];
    }

    private async createSubject(idUnit: number, Name: string, identifier: DBAPI.Identifier | null): Promise<DBAPI.Subject | null> {
        // create the subject
        const subjectDB: DBAPI.Subject = new DBAPI.Subject({
            idUnit,
            idAssetThumbnail: null,
            idGeoLocation: null,
            Name,
            idIdentifierPreferred: (identifier) ? identifier.idIdentifier : null, // identifierSubjectHookup.idIdentifier,
            idSubject: 0
        });
        if (!await subjectDB.create()) {
            LOG.error(`ingestData unable to create subject record with name ${Name}`, LOG.LS.eGQL);
            return null;
        }
        return subjectDB;
    }

    private async updateSubjectIdentifier(identifier: DBAPI.Identifier | null, subjectDB: DBAPI.Subject): Promise<boolean> {
        // update identifier with systemobject ID of our subject
        if (!identifier)
            return true;
        const SO: DBAPI.SystemObject | null = await subjectDB.fetchSystemObject();
        if (!SO) {
            LOG.error(`ingestData unable to fetch system object for subject record ${JSON.stringify(subjectDB)}`, LOG.LS.eGQL);
            return false;
        }
        identifier.idSystemObject = SO.idSystemObject;
        if (!await identifier.update()) {
            LOG.error(`ingestData unable to update identifier's idSystemObject ${JSON.stringify(identifier)}`, LOG.LS.eGQL);
            return false;
        }

        return true;
    }

    private async validateExistingSubject(subject: IngestSubjectInput, units: DBAPI.Unit[] | null): Promise<DBAPI.Subject | null> {
        // if this subject exists, validate it
        const subjectDB: DBAPI.Subject | null = subject.id ? await DBAPI.Subject.fetch(subject.id) : null;
        if (!subjectDB) {
            LOG.error(`ingestData called with invalid subject ${subject.id}`, LOG.LS.eGQL);
            return null;
        }

        // existing subjects must be connected to an existing unit
        if (!units || units.length == 0) {
            LOG.error(`ingestData called with invalid subject's unit ${subject.unit}`, LOG.LS.eGQL);
            return null;
        }

        await this.appendToWFReport(`Subject ${subject.name} (ARK ID ${subject.arkId}) validated`);
        return subjectDB;
    }

    private async createSubjectAndRelated(subject: IngestSubjectInput, units: DBAPI.Unit[] | null): Promise<DBAPI.Subject | null> {
        // identify Unit; create UnitEdan if needed
        const unit: DBAPI.Unit | null = await this.validateOrCreateUnitEdan(units, subject.unit);
        if (!unit)
            return null;

        // create identifier
        let identifier: DBAPI.Identifier | null = null;
        if (subject.arkId) {
            identifier = await this.createIdentifier(subject.arkId, null, null, true);
            if (!identifier)
                return null;
        }

        // create the subject
        const subjectDB: DBAPI.Subject | null = await this.createSubject(unit.idUnit, subject.name, identifier);
        if (!subjectDB)
            return null;
        await this.appendToWFReport(`Subject ${subject.name} (ARK ID ${subject.arkId}) created`);

        // update identifier, if it exists with systemobject ID of our subject
        if (!await this.updateSubjectIdentifier(identifier, subjectDB))
            return null;

        return subjectDB;
    }

    private async wireProjectToSubjects(idProject: number, subjectsDB: DBAPI.Subject[]): Promise<boolean> {
        const projectDB: DBAPI.Project | null = await DBAPI.Project.fetch(idProject);
        if (!projectDB) {
            LOG.error(`ingestData unable to fetch project ${idProject}`, LOG.LS.eGQL);
            return false;
        }

        for (const subjectDB of subjectsDB) {
            const xref: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(projectDB, subjectDB);
            if (!xref) {
                LOG.error(`ingestData unable to wire project ${JSON.stringify(projectDB)} to subject ${JSON.stringify(subjectDB)}`, LOG.LS.eGQL);
                return false;
            }
        }
        return true;
    }

    private async fetchOrCreateItem(item: IngestItemInput): Promise<DBAPI.Item | null> {
        let itemDB: DBAPI.Item | null;
        if (item.id) {
            itemDB = await DBAPI.Item.fetch(item.id);
            if (!itemDB)
                LOG.error(`ingestData could not compute item from ${item.id}`, LOG.LS.eGQL);
        } else {
            itemDB = new DBAPI.Item({
                idAssetThumbnail: null,
                idGeoLocation: null,
                Name: item.name,
                EntireSubject: item.entireSubject,
                idItem: 0
            });

            if (!await itemDB.create()) {
                LOG.error(`ingestData unable to create item from ${JSON.stringify(item)}`, LOG.LS.eGQL);
                return null;
            }
        }

        return itemDB;
    }

    private async wireSubjectsToItem(subjectsDB: DBAPI.Subject[], itemDB: DBAPI.Item): Promise<boolean> {
        for (const subjectDB of subjectsDB) {
            const xref: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(subjectDB, itemDB);
            if (!xref) {
                LOG.error(`ingestData unable to wire subject ${JSON.stringify(subjectDB)} to item ${JSON.stringify(itemDB)}`, LOG.LS.eGQL);
                return false;
            }
        }
        return true;
    }

    private async createPhotogrammetryObjects(photogrammetry: IngestPhotogrammetryInput): Promise<boolean> {
        const vocabulary: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eCaptureDataCaptureMethodPhotogrammetry);
        if (!vocabulary) {
            LOG.error('ingestData unable to retrieve photogrammetry capture method vocabulary from cache', LOG.LS.eGQL);
            return false;
        }

        // TODO: if we're updating an existing Capture Data Set, we should update these records instead of creating new ones
        // create photogrammetry objects, identifiers, etc.
        const captureDataDB: DBAPI.CaptureData = new DBAPI.CaptureData({
            Name: photogrammetry.name,
            idVCaptureMethod: vocabulary.idVocabulary,
            DateCaptured: H.Helpers.convertStringToDate(photogrammetry.dateCaptured) || new Date(),
            Description: photogrammetry.description,
            idAssetThumbnail: null,
            idCaptureData: 0
        });
        if (!await captureDataDB.create()) {
            LOG.error(`ingestData unable to create CaptureData for photogrammetry data ${JSON.stringify(photogrammetry)}`, LOG.LS.eGQL);
            return false;
        }
        const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromCaptureData(captureDataDB);
        const path: string = SOI ? RouteBuilder.RepositoryDetails(SOI.idSystemObject, eHrefMode.ePrependClientURL) : '';
        const href: string = H.Helpers.computeHref(path, captureDataDB.Name);
        await this.appendToWFReport(`CaptureData Photogrammetry: ${href}`);

        const captureDataPhotoDB: DBAPI.CaptureDataPhoto = new DBAPI.CaptureDataPhoto({
            idVCaptureDatasetType: photogrammetry.datasetType,
            CaptureDatasetFieldID: photogrammetry.datasetFieldId ? photogrammetry.datasetFieldId : null,
            idVItemPositionType: photogrammetry.itemPositionType ? photogrammetry.itemPositionType : null,
            ItemPositionFieldID: photogrammetry.itemPositionFieldId ? photogrammetry.itemPositionFieldId : null,
            ItemArrangementFieldID: photogrammetry.itemArrangementFieldId ? photogrammetry.itemArrangementFieldId : null,
            idVFocusType: photogrammetry.focusType ? photogrammetry.focusType : null,
            idVLightSourceType: photogrammetry.lightsourceType ? photogrammetry.lightsourceType : null,
            idVBackgroundRemovalMethod: photogrammetry.backgroundRemovalMethod ? photogrammetry.backgroundRemovalMethod : null,
            idVClusterType: photogrammetry.clusterType ? photogrammetry.clusterType : null,
            ClusterGeometryFieldID: photogrammetry.clusterGeometryFieldId ? photogrammetry.clusterGeometryFieldId : null,
            CameraSettingsUniform: false,
            idCaptureData: captureDataDB.idCaptureData,
            idCaptureDataPhoto: 0
        });
        if (!await captureDataPhotoDB.create()) {
            LOG.error(`ingestData unable to create CaptureDataPhoto for photogrammetry data ${JSON.stringify(photogrammetry)}`, LOG.LS.eGQL);
            return false;
        }

        if (!await this.handleIdentifiers(captureDataDB, photogrammetry.systemCreated, photogrammetry.identifiers))
            return false;

        // wire photogrammetry to sourceObjects
        if (photogrammetry.sourceObjects && photogrammetry.sourceObjects.length > 0) {
            for (const sourceObject of photogrammetry.sourceObjects) {
                if (!await DBAPI.SystemObjectXref.wireObjectsIfNeeded(sourceObject.idSystemObject, captureDataDB)) {
                    LOG.error('ingestData failed to create SystemObjectXref', LOG.LS.eGQL);
                    continue;
                }
            }
        }

        // wire photogrammetry to derivedObjects
        if (photogrammetry.derivedObjects && photogrammetry.derivedObjects.length > 0) {
            for (const derivedObject of photogrammetry.derivedObjects) {
                if (!await DBAPI.SystemObjectXref.wireObjectsIfNeeded(captureDataDB, derivedObject.idSystemObject)) {
                    LOG.error('ingestData failed to create SystemObjectXref', LOG.LS.eGQL);
                    continue;
                }
            }
        }

        if (photogrammetry.idAssetVersion) {
            this.assetVersionMap.set(photogrammetry.idAssetVersion, captureDataDB);
            this.ingestPhotoMap.set(photogrammetry.idAssetVersion, photogrammetry);
        }

        return true;
    }

    private async createPhotogrammetryDerivedObjects(ingestResMap: Map<number, IngestAssetResult | null>): Promise<boolean> {
        // create CaptureDataFile
        let res: boolean = true;
        for (const [idAssetVersion, SOBased] of this.assetVersionMap) {
            if (!(SOBased instanceof DBAPI.CaptureData))
                continue;
            const ingestAssetRes: IngestAssetResult | null | undefined = ingestResMap.get(idAssetVersion);
            if (!ingestAssetRes) {
                LOG.error(`ingestData unable to locate ingest results for idAssetVersion ${idAssetVersion}`, LOG.LS.eGQL);
                res = false;
                continue;
            }
            if (!ingestAssetRes.success) {
                LOG.error(`ingestData failed for idAssetVersion ${idAssetVersion}: ${ingestAssetRes.error}`, LOG.LS.eGQL);
                res = false;
                continue;
            }

            const ingestPhotoInput: IngestPhotogrammetryInput | undefined = this.ingestPhotoMap.get(idAssetVersion);
            if (!ingestPhotoInput) {
                LOG.error(`ingestData unable to find photogrammetry input for idAssetVersion ${idAssetVersion}`, LOG.LS.eGQL);
                res = false;
                continue;
            }

            const folderVariantMap: Map<string, number> = new Map<string, number>(); // map of normalized folder name to variant vocabulary id
            for (const folder of ingestPhotoInput.folders) {
                folderVariantMap.set(folder.name.toLowerCase(), folder.variantType);
                // LOG.info(`ingestData mapping ${folder.name.toLowerCase()} -> ${folder.variantType}`, LOG.LS.eGQL);
            }

            for (const asset of ingestAssetRes.assets || []) {
                // map asset's file path to variant type
                let idVVariantType: number = folderVariantMap.get(asset.FilePath.toLowerCase()) || 0;
                if (!idVVariantType) {  // if that failed, try again with the last part of the path
                    let lastSlash: number = asset.FilePath.lastIndexOf('/');
                    if (lastSlash === -1)
                        lastSlash = asset.FilePath.lastIndexOf('\\');
                    const variantPath = asset.FilePath.substring(lastSlash + 1).toLowerCase();

                    idVVariantType = folderVariantMap.get(variantPath) || 0;
                }
                // LOG.info(`ingestData mapped ${asset.FilePath} to variant ${idVVariantType}`, LOG.LS.eGQL);

                const CDF: DBAPI.CaptureDataFile = new DBAPI.CaptureDataFile({
                    idCaptureData: SOBased.idCaptureData,
                    idAsset: asset.idAsset,
                    idVVariantType,
                    CompressedMultipleFiles: false,
                    idCaptureDataFile: 0
                });
                if (!await CDF.create()) {
                    LOG.error(`ingestData unable to create CaptureDataFile for idAssetVersion ${idAssetVersion}, asset ${JSON.stringify(asset)}`, LOG.LS.eGQL);
                    res = false;
                    continue;
                }
            }
        }
        return res;
    }

    private async createModelObjects(model: IngestModelInput): Promise<boolean> {
        const JCOutput: JobCookSIPackratInspectOutput | null = await JobCookSIPackratInspectOutput.extractFromAssetVersion(model.idAssetVersion);
        if (!JCOutput || !JCOutput.success || !JCOutput.modelConstellation || !JCOutput.modelConstellation.Model) {
            LOG.error(`ingestData createModelObjects failed to extract JobCookSIPackratInspectOutput from idAssetVersion ${model.idAssetVersion}`, LOG.LS.eGQL);
            return false;
        }

        let modelDB: DBAPI.Model = JCOutput.modelConstellation.Model;
        modelDB.Name = model.name;
        modelDB.DateCreated = H.Helpers.convertStringToDate(model.dateCaptured) || new Date();
        modelDB.idVCreationMethod = model.creationMethod;
        modelDB.idVModality = model.modality;
        modelDB.idVPurpose = model.purpose;
        modelDB.idVUnits = model.units;
        modelDB.idVFileType = model.modelFileType;

        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(model.idAssetVersion);
        if (!assetVersion) {
            LOG.error(`ingestData unable to fetch asset version from ${JSON.stringify(model)}`, LOG.LS.eGQL);
            return false;
        }
        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
        if (!asset) {
            LOG.error(`ingestData unable to fetch asset from ${JSON.stringify(model)}, idAsset ${assetVersion.idAsset}`, LOG.LS.eGQL);
            return false;
        }
        const assetMap: Map<string, number> = new Map<string, number>();
        assetMap.set(asset.FileName, asset.idAsset);

        // write entries to database
        // LOG.info(`ingestData createModelObjects model=${JSON.stringify(model, H.Helpers.saferStringify)} vs asset=${JSON.stringify(asset, H.Helpers.saferStringify)}vs assetVersion=${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
        // Examine model.idAsset; if Asset.idVAssetType -> model or model geometry file, then
        // Lookup SystemObject from Asset.idSystemObject; if idModel is not null, then use that idModel
        let idModel: number = 0;
        if (model.idAsset) {
            const assetType: CACHE.eVocabularyID | undefined = await asset.assetType();
            if (assetType === CACHE.eVocabularyID.eAssetAssetTypeModel ||
                assetType === CACHE.eVocabularyID.eAssetAssetTypeModelGeometryFile) {
                const SO: DBAPI.SystemObject | null = asset.idSystemObject ? await DBAPI.SystemObject.fetch(asset.idSystemObject) : null;
                if (!SO) {
                    LOG.error(`ingestData unable to fetch model's asset's system object ${JSON.stringify(asset, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                    return false;
                }

                if (SO.idModel)                 // Is this a model?
                    idModel = SO.idModel;       // Yes: Use it!
            }
        }

        const res: H.IOResults = await JCOutput.persist(idModel, assetMap);
        if (!res.success) {
            LOG.error(`ingestData unable to create model constellation ${JSON.stringify(model)}: ${res.success}`, LOG.LS.eGQL);
            return false;
        }
        modelDB = JCOutput.modelConstellation.Model; // retrieve again, as we may have swapped the object above, in JCOutput.persist

        const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromModel(modelDB);
        const path: string = SOI ? RouteBuilder.RepositoryDetails(SOI.idSystemObject, eHrefMode.ePrependClientURL) : '';
        const href: string = H.Helpers.computeHref(path, modelDB.Name);
        await this.appendToWFReport(`Model: ${href}`);

        if (!await this.handleIdentifiers(modelDB, model.systemCreated, model.identifiers))
            return false;

        // wire model to sourceObjects
        if (model.sourceObjects && model.sourceObjects.length > 0) {
            for (const sourceObject of model.sourceObjects) {
                if (!await DBAPI.SystemObjectXref.wireObjectsIfNeeded(sourceObject.idSystemObject, modelDB)) {
                    LOG.error('ingestData failed to create SystemObjectXref', LOG.LS.eGQL);
                    continue;
                }
            }
        }

        // wire model to derivedObjects
        if (model.derivedObjects && model.derivedObjects.length > 0) {
            for (const derivedObject of model.derivedObjects) {
                if (!await DBAPI.SystemObjectXref.wireObjectsIfNeeded(modelDB, derivedObject.idSystemObject)) {
                    LOG.error('ingestData failed to create SystemObjectXref', LOG.LS.eGQL);
                    continue;
                }
            }
        }

        if (model.idAssetVersion)
            this.assetVersionMap.set(model.idAssetVersion, modelDB);
        return true;
    }

    private async createSceneObjects(scene: IngestSceneInput): Promise<{ success: boolean, transformUpdated?: boolean | undefined }> {
        const sceneConstellation: DBAPI.SceneConstellation | null = await DBAPI.SceneConstellation.fetchFromAssetVersion(scene.idAssetVersion, scene.directory);
        if (!sceneConstellation || !sceneConstellation.Scene)
            return { success: false };

        // Examine scene.idAsset; if Asset.idVAssetType -> scene then
        // Lookup SystemObject from Asset.idSystemObject; if idScene is not null, then use that idScene
        const updateMode: boolean = (scene.idAsset != null && scene.idAsset > 0);
        let sceneDB: DBAPI.Scene | null = sceneConstellation.Scene;
        if (updateMode) {
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(scene.idAsset!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!asset) {
                LOG.error(`ingestData createSceneObjects unable to fetch scene's asset for ${JSON.stringify(scene, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                return { success: false };
            }
            const assetType: CACHE.eVocabularyID | undefined = await asset.assetType();
            if (assetType === CACHE.eVocabularyID.eAssetAssetTypeScene) {
                const SO: DBAPI.SystemObject | null = asset.idSystemObject ? await DBAPI.SystemObject.fetch(asset.idSystemObject) : null;
                if (!SO) {
                    LOG.error(`ingestData createSceneObjects unable to fetch scene's asset's system object ${JSON.stringify(asset, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                    return { success: false };
                }

                if (SO.idScene) {               // Is this a scene?  If so, use it!
                    sceneDB = await DBAPI.Scene.fetch(SO.idScene);
                    if (!sceneDB) {
                        LOG.error(`ingestData createSceneObjects unable to fetch scene with ID ${SO.idScene} from ${JSON.stringify(SO, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                        return { success: false };
                    }
                }
            }
        }

        sceneDB.Name = scene.name;
        sceneDB.HasBeenQCd = scene.hasBeenQCd;
        sceneDB.IsOriented = scene.isOriented;
        LOG.info(`ingestData createSceneObjects, updateMode=${updateMode}, sceneDB=${JSON.stringify(sceneDB, H.Helpers.saferStringify)}, sceneConstellation=${JSON.stringify(sceneConstellation, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
        let success: boolean = sceneDB.idScene ? await sceneDB.update() : await sceneDB.create();

        const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromScene(sceneDB);
        const path: string = SOI ? RouteBuilder.RepositoryDetails(SOI.idSystemObject, eHrefMode.ePrependClientURL) : '';
        const href: string = H.Helpers.computeHref(path, sceneDB.Name);
        await this.appendToWFReport(`Scene: ${href}`);

        if (!await this.handleIdentifiers(sceneDB, scene.systemCreated, scene.identifiers))
            return { success: false };

        // wire scene to reference models, including SystemObjectXref of 'scene as master' to 'models as derived'
        let transformUpdated: boolean = false;
        if (sceneConstellation.ModelSceneXref && sceneConstellation.ModelSceneXref.length > 0) {
            if (!updateMode)
                transformUpdated = true; // in create mode, treat the transform as updated

            for (const MSX of sceneConstellation.ModelSceneXref) {
                if (MSX.idModelSceneXref || MSX.idScene) {
                    LOG.error(`ingestData could not create ModelSceneXref for Scene ${sceneDB.idScene}, as record already was populated: ${JSON.stringify(MSX)}`, LOG.LS.eGQL);
                    continue;
                }
                if (MSX.idModel <= 0) {
                    LOG.error(`ingestData could not create ModelSceneXref for Scene ${sceneDB.idScene}, as model has not yet been ingested: ${JSON.stringify(MSX)}`, LOG.LS.eGQL);
                    continue;
                }

                // look for existing xref:
                const MSXExisting: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromModelAndScene(MSX.idModel, sceneDB.idScene);
                let MSXUpdate: DBAPI.ModelSceneXref | null = (MSXExisting && MSXExisting.length > 0) ? MSXExisting[0] : null;
                if (MSXUpdate) {
                    if (MSXUpdate.updateTransformIfNeeded(MSX)) {
                        success = await MSXUpdate.update();
                        transformUpdated = true;
                    }
                } else {
                    MSX.idScene = sceneDB.idScene;
                    success = await MSX.create() && success;
                    MSXUpdate = MSX;
                }

                const modelDB: DBAPI.Model | null = await DBAPI.Model.fetch(MSXUpdate.idModel);
                if (!modelDB || !await DBAPI.SystemObjectXref.wireObjectsIfNeeded(sceneDB, modelDB)) {
                    LOG.error(`ingestData could not create SystemObjectXref for Scene ${sceneDB.idScene} using: ${JSON.stringify(MSXUpdate)}`, LOG.LS.eGQL);
                    success = false;
                    continue;
                }
            }
        }

        // wire scene to sourceObjects
        if (scene.sourceObjects && scene.sourceObjects.length > 0) {
            for (const sourceObject of scene.sourceObjects) {
                if (!await DBAPI.SystemObjectXref.wireObjectsIfNeeded(sourceObject.idSystemObject, sceneDB)) {
                    LOG.error('ingestData failed to create SystemObjectXref', LOG.LS.eGQL);
                    continue;
                }
            }
        }

        // wire scene to derivedObjects
        if (scene.derivedObjects && scene.derivedObjects.length > 0) {
            for (const derivedObject of scene.derivedObjects) {
                if (!await DBAPI.SystemObjectXref.wireObjectsIfNeeded(sceneDB, derivedObject.idSystemObject)) {
                    LOG.error('ingestData failed to create SystemObjectXref', LOG.LS.eGQL);
                    continue;
                }
            }
        }


        if (scene.idAssetVersion)
            this.assetVersionMap.set(scene.idAssetVersion, sceneDB);
        return { success, transformUpdated };
    }

    private async createOtherObjects(other: IngestOtherInput): Promise<boolean> {
        // "other" means we're simply creating an asset version (and associated asset)
        // fetch the associated asset and use that for identifiers
        // BUT ... populate this.assetVersionMap with the system object that owns the specified asset ... or if none, the asset itself.
        let idAsset: number | null | undefined = other.idAsset;
        if (!idAsset) {
            const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(other.idAssetVersion);
            if (!assetVersion) {
                LOG.error(`ingestData could not fetch asset version for ${other.idAssetVersion}`, LOG.LS.eGQL);
                return false;
            }
            idAsset = assetVersion.idAsset;
        }

        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(idAsset);
        if (!asset) {
            LOG.error(`ingestData could not fetch asset for ${idAsset}`, LOG.LS.eGQL);
            return false;
        }

        if (!await this.handleIdentifiers(asset, other.systemCreated, other.identifiers))
            return false;

        if (other.idAssetVersion) {
            // if the asset is owned by a system object, use that system object as the owner of the new asset version
            let SOOwner: DBAPI.SystemObjectBased | null = null;
            if (asset.idSystemObject) {
                const SOP: DBAPI.SystemObjectPairs | null = await DBAPI.SystemObjectPairs.fetch(asset.idSystemObject);
                if (!SOP) {
                    LOG.error(`ingestData could not fetch system object paids from ${JSON.stringify(asset, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                    return false;
                }
                SOOwner = SOP.SystemObjectBased;
            }
            if (!SOOwner)
                SOOwner = asset;

            this.assetVersionMap.set(other.idAssetVersion, SOOwner);
        }
        return true;
    }

    private async wireItemToAssetOwners(itemDB: DBAPI.Item): Promise<boolean> {
        for (const SOBased of this.assetVersionMap.values()) {
            const xref: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(itemDB, SOBased);
            if (!xref) {
                LOG.error(`ingestData unable to wire item ${JSON.stringify(itemDB)} to asset owner ${JSON.stringify(SOBased)}`, LOG.LS.eGQL);
                return false;
            }
        }
        return true;
    }

    private async promoteAssetsIntoRepository(): Promise<{ ingestResMap: Map<number, IngestAssetResult | null>, transformUpdated: boolean }> {
        const user: User = this.user!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

        // map from idAssetVersion -> object that "owns" the asset
        const ingestResMap: Map<number, IngestAssetResult | null> = new Map<number, IngestAssetResult | null>();
        let transformUpdated: boolean = false;
        for (const [idAssetVersion, SOBased] of this.assetVersionMap) {
            // LOG.info(`ingestData.promoteAssetsIntoRepository ${idAssetVersion} -> ${JSON.stringify(SOBased)}`, LOG.LS.eGQL);
            const assetVersionDB: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion);
            if (!assetVersionDB) {
                LOG.error(`ingestData unable to load assetVersion for ${idAssetVersion}`, LOG.LS.eGQL);
                ingestResMap.set(idAssetVersion, null);
                continue;
            }

            const assetDB: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersionDB.idAsset);
            if (!assetDB) {
                LOG.error(`ingestData unable to load asset for ${assetVersionDB.idAsset}`, LOG.LS.eGQL);
                ingestResMap.set(idAssetVersion, null);
                continue;
            }

            // LOG.info(`ingestData.promoteAssetsIntoRepository AssetVersion=${JSON.stringify(assetVersionDB, H.Helpers.saferStringify)}; Asset=${JSON.stringify(assetDB, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
            const opInfo: OperationInfo = {
                message: 'Ingesting asset',
                idUser: user.idUser,
                userEmailAddress: user.EmailAddress,
                userName: user.Name
            };
            const ingestAssetInput: IngestAssetInput = {
                asset: assetDB,
                assetVersion: assetVersionDB,
                allowZipCracking: true,
                SOBased,
                idSystemObject: null,
                opInfo,
            };

            const ISR: IngestAssetResult = await AssetStorageAdapter.ingestAsset(ingestAssetInput);
            if (!ISR.success) {
                LOG.error(`ingestData unable to ingest assetVersion ${idAssetVersion}: ${ISR.error}`, LOG.LS.eGQL);
                await this.appendToWFReport(`<b>Asset Ingestion Failed</b>: ${ISR.error}`);
            } else {
                if (ISR.assetVersions) {
                    for (const assetVersion of ISR.assetVersions) {
                        const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromAssetVersion(assetVersion);
                        const pathObject: string = SOI ? RouteBuilder.RepositoryDetails(SOI.idSystemObject, eHrefMode.ePrependClientURL) : '';
                        const hrefObject: string = H.Helpers.computeHref(pathObject, assetVersion.FileName);
                        const pathDownload: string = RouteBuilder.DownloadAssetVersion(assetVersion.idAssetVersion, eHrefMode.ePrependServerURL);
                        const hrefDownload: string = H.Helpers.computeHref(pathDownload, 'Download');
                        await this.appendToWFReport(`Ingested ${hrefObject}: ${hrefDownload}`);
                    }
                }
                if (ISR.assets) {
                    // Handle complex ingestion, such as ingestion of a scene package as a zip file.
                    // In this case, we will receive the scene .svx.json file, supporting HTML, images, CSS, as well as models.
                    // Each model asset needs a Model and ModelSceneXref, and the asset in question should be owned by the model.
                    if (SOBased instanceof DBAPI.Scene) {
                        const { success, transformUpdated: modelTransformUpdated } = await this.handleComplexIngestionScene(SOBased, ISR);
                        if (success && modelTransformUpdated)
                            transformUpdated = true;
                    }
                }
            }
            ingestResMap.set(idAssetVersion, ISR);
        }
        if (transformUpdated)
            await this.appendToWFReport('Scene ingested with Model Transform(s) Updated');
        return { ingestResMap, transformUpdated };
    }

    private async sendWorkflowIngestionEvent(ingestResMap: Map<number, IngestAssetResult | null>, modelTransformUpdated: boolean): Promise<boolean> {
        const workflowEngine: WF.IWorkflowEngine | null | undefined = this.workflowHelper?.workflowEngine;
        if (!workflowEngine) {
            LOG.error('ingestData sendWorkflowIngestionEvent could not load WorkflowEngine', LOG.LS.eGQL);
            return false;
        }

        const user: User = this.user!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

        // compute set of unique asset versions ingested:
        let ret: boolean = true;
        const idSystemObject: number[] = [];
        for (const IAR of ingestResMap.values()) {
            if (IAR && IAR.assetVersions) {
                for (const assetVersion of IAR.assetVersions) {
                    const oID: DBAPI.ObjectIDAndType = { idObject: assetVersion.idAssetVersion, eObjectType: DBAPI.eSystemObjectType.eAssetVersion };
                    const sysInfo: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
                    if (!sysInfo) {
                        LOG.error(`ingestData sendWorkflowIngestionEvent could not find system object for ${JSON.stringify(oID)}`, LOG.LS.eGQL);
                        ret = false;
                        continue;
                    }
                    idSystemObject.push(sysInfo.idSystemObject);
                }
            }
        }

        if (idSystemObject.length > 0) {
            const workflowParams: WF.WorkflowParameters = {
                eWorkflowType: null,
                idSystemObject,
                idProject: null, // TODO: update with project ID
                idUserInitiator: user.idUser,
                parameters: modelTransformUpdated ? { modelTransformUpdated } : null
            };

            await this.appendToWFReport('Sending WorkflowEngine IngestObject event');

            // send workflow engine event, but don't wait for results
            workflowEngine.event(CACHE.eVocabularyID.eWorkflowEventIngestionIngestObject, workflowParams);
        }

        return ret;
    }

    validateInput(): H.IOResults {
        this.ingestPhotogrammetry = this.input.photogrammetry && this.input.photogrammetry.length > 0;
        this.ingestModel = this.input.model && this.input.model.length > 0;
        this.ingestScene = this.input.scene && this.input.scene.length > 0;
        this.ingestOther = this.input.other && this.input.other.length > 0;
        this.ingestNew = false;
        this.ingestUpdate = false;

        if (this.ingestPhotogrammetry) {
            for (const photogrammetry of this.input.photogrammetry) {
                if (photogrammetry.idAssetVersion)
                    this.assetVersionSet.add(photogrammetry.idAssetVersion);
                if (photogrammetry.idAsset)
                    this.ingestUpdate = true;
                else
                    this.ingestNew = true;
            }
        }

        if (this.ingestModel) {
            for (const model of this.input.model) {
                if (model.idAssetVersion)
                    this.assetVersionSet.add(model.idAssetVersion);
                if (model.idAsset)
                    this.ingestUpdate = true;
                else
                    this.ingestNew = true;
            }
        }

        if (this.ingestScene) {
            for (const scene of this.input.scene) {
                if (scene.idAssetVersion)
                    this.assetVersionSet.add(scene.idAssetVersion);
                if (scene.idAsset)
                    this.ingestUpdate = true;
                else
                    this.ingestNew = true;
            }
        }

        if (this.ingestOther) {
            for (const other of this.input.other) {
                if (other.idAssetVersion)
                    this.assetVersionSet.add(other.idAssetVersion);
                if (other.idAsset)
                    this.ingestUpdate = true;
                else
                    this.ingestNew = true;
            }
        }

        // data validation; FYI ... this.input.project is allowed to be unspecified
        if (this.ingestNew && this.ingestUpdate) {
            const error: string = 'ingestData called with an unsupported mix of additions and updates';
            LOG.error(error, LOG.LS.eGQL);
            return { success: false, error };
        }

        if (!this.ingestNew && !this.ingestUpdate) {
            const error: string = 'ingestData called without both additions and updates';
            LOG.error(error, LOG.LS.eGQL);
            return { success: false, error };
        }

        if (this.ingestNew) {
            if (!this.input.subjects || this.input.subjects.length == 0) {
                const error: string = 'ingestData called with no subjects';
                LOG.error(error, LOG.LS.eGQL);
                return { success: false, error };
            }

            if (!this.input.item) {
                const error: string = 'ingestData called with no item';
                LOG.error(error, LOG.LS.eGQL);
                return { success: false, error };
            }
        }

        if (!this.user) {
            const error: string = 'ingestData unable to retrieve user context';
            LOG.error(error, LOG.LS.eGQL);
            return { success: false, error };
        }
        return { success: true, error: '' };
    }

    private async handleComplexIngestionScene(scene: DBAPI.Scene, ISR: IngestAssetResult): Promise<{ success: boolean, transformUpdated: boolean }> {
        if (!ISR.assets || !ISR.assetVersions)
            return { success: false, transformUpdated: false };

        // first, identify assets and asset versions for the scene and models
        let sceneAsset: DBAPI.Asset | null = null;
        let sceneAssetVersion: DBAPI.AssetVersion | undefined = undefined;
        const modelAssetMap: Map<string, AssetPair> = new Map<string, AssetPair>(); // map of asset name -> { asset, asset version }

        const assetVersionMap: Map<number, DBAPI.AssetVersion> = new Map<number, DBAPI.AssetVersion>(); // map of *asset* id -> asset version
        for (const assetVersion of ISR.assetVersions)
            assetVersionMap.set(assetVersion.idAsset, assetVersion); // idAsset is correct here!

        for (const asset of ISR.assets) {
            switch (await asset.assetType()) {
                case eVocabularyID.eAssetAssetTypeScene:
                    if (!sceneAsset) {
                        sceneAsset = asset;
                        sceneAssetVersion = assetVersionMap.get(asset.idAsset);
                    } else
                        LOG.error(`ingestData handleComplexIngestionScene skipping unexpected scene ${JSON.stringify(asset, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                    break;

                case eVocabularyID.eAssetAssetTypeModel:
                case eVocabularyID.eAssetAssetTypeModelGeometryFile: {
                    const assetVersion: DBAPI.AssetVersion | undefined = assetVersionMap.get(asset.idAsset);
                    modelAssetMap.set(asset.FileName.toLowerCase(), { asset, assetVersion });
                } break;
                case undefined:
                    LOG.error(`ingestData handleComplexIngestionScene unable to detect asset type for ${JSON.stringify(asset, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                    break;
            }
        }

        if (!sceneAsset || !sceneAssetVersion) {
            LOG.error(`ingestData handleComplexIngestionScene unable to identify asset and/or asset version for the ingested scene ${JSON.stringify(scene, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
            return { success: false, transformUpdated: false };
        }

        // next, retrieve & parse the scene, extracting model references and transforms
        const RSR: ReadStreamResult = await AssetStorageAdapter.readAsset(sceneAsset, sceneAssetVersion);
        if (!RSR.success || !RSR.readStream) {
            LOG.error(`ingestData handleComplexIngestionScene unable to fetch stream for scene asset ${JSON.stringify(sceneAsset, H.Helpers.saferStringify)}: ${RSR.error}`, LOG.LS.eGQL);
            return { success: false, transformUpdated: false };
        }

        const svx: SvxReader = new SvxReader();
        const res: H.IOResults = await svx.loadFromStream(RSR.readStream);
        if (!res.success || !svx.SvxExtraction) {
            LOG.error(`ingestData handleComplexIngestionScene unable to parse scene asset ${JSON.stringify(sceneAsset, H.Helpers.saferStringify)}: ${res.error}`, LOG.LS.eGQL);
            return { success: false, transformUpdated: false };
        }

        this.extractSceneMetrics(scene, svx.SvxExtraction);
        if (!await scene.update())
            LOG.error(`ingestData handleComplexIngestionScene unable to update scene ${JSON.stringify(scene, H.Helpers.saferStringify)}`, LOG.LS.eGQL);

        // finally, create/update Model and ModelSceneXref for each model reference:
        let success: boolean = true;
        let transformUpdated: boolean = false;
        if (svx.SvxExtraction.modelDetails) {
            for (const MSX of svx.SvxExtraction.modelDetails) {
                if (!MSX.Name)
                    continue;
                let model: DBAPI.Model | null = null;

                // look for matching ModelSceneXref
                // scene.idScene, MSX.Name, .Usage, .Quality, .UVResolution
                // if not found, create model and MSX
                // if found, determine if MSX transform has changed; if so, update MSX, and return a status that can be used to kick off download generation workflow
                const MSXSources: DBAPI.ModelSceneXref[] | null =
                    await DBAPI.ModelSceneXref.fetchFromSceneNameUsageQualityUVResolution(scene.idScene, MSX.Name, MSX.Usage, MSX.Quality, MSX.UVResolution);
                const MSXSource: DBAPI.ModelSceneXref | null = (MSXSources && MSXSources.length > 0) ? MSXSources[0] : null;
                if (MSXSource) {
                    if (MSXSource.updateTransformIfNeeded(MSX)) {
                        if (!await MSXSource.update()) {
                            LOG.error(`ingestData handleComplexIngestionScene unable to update ModelSceneXref ${JSON.stringify(MSXSource, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                            success = false;
                        }
                        transformUpdated = true;
                    }

                    model = await DBAPI.Model.fetch(MSXSource.idModel);
                    if (!model) {
                        LOG.error(`ingestData handleComplexIngestionScene unable to load model ${MSXSource.idModel}`, LOG.LS.eGQL);
                        success = false;
                        continue;
                    }
                    LOG.info(`ingestData handleComplexIngestionScene found existing ModelSceneXref=${JSON.stringify(MSXSource, H.Helpers.saferStringify)} from referenced model ${JSON.stringify(MSX)}`, LOG.LS.eGQL);
                } else {
                    model = await this.transformModelSceneXrefIntoModel(MSX);
                    if (!await model.create()) {
                        LOG.error(`ingestData handleComplexIngestionScene unable to create Model from referenced model ${JSON.stringify(MSX)}`, LOG.LS.eGQL);
                        success = false;
                        continue;
                    }
                    LOG.info(`ingestData handleComplexIngestionScene created model=${JSON.stringify(model, H.Helpers.saferStringify)} from referenced model ${JSON.stringify(MSX)}`, LOG.LS.eGQL);

                    // Create ModelSceneXref for model and scene
                    /* istanbul ignore else */
                    if (!MSX.idModelSceneXref) { // should always be true
                        MSX.idModel = model.idModel;
                        MSX.idScene = scene.idScene;
                        if (!await MSX.create()) {
                            LOG.error(`ingestData handleComplexIngestionScene unable to create ModelSceneXref for model xref ${JSON.stringify(MSX)}`, LOG.LS.eGQL);
                            success = false;
                            continue;
                        }
                    } else
                        LOG.error(`ingestData handleComplexIngestionScene unexpected non-null ModelSceneXref for model xref ${JSON.stringify(MSX)}`, LOG.LS.eGQL);

                    const SOX: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(scene, model);
                    if (!SOX) {
                        LOG.error(`ingestData handleComplexIngestionScene unable to wire Scene ${JSON.stringify(scene, H.Helpers.saferStringify)} and Model ${JSON.stringify(model, H.Helpers.saferStringify)} together`, LOG.LS.eGQL);
                        success = false;
                        continue;
                    }
                }

                const assetPair: AssetPair | undefined = modelAssetMap.get(MSX.Name.toLowerCase());
                if (!assetPair || !assetPair.asset || !assetPair.assetVersion) {
                    LOG.info(`ingestData handleComplexIngestionScene unable to locate assets for SVX model ${JSON.stringify(MSX)}`, LOG.LS.eGQL);
                    continue;
                }

                // reassign asset to model; create SystemObjectVersion and SystemObjectVersionAssetVersionXref
                const SO: DBAPI.SystemObject | null = await model.fetchSystemObject();
                if (!SO) {
                    LOG.error(`ingestData handleComplexIngestionScene unable to fetch SystemObject for Model ${JSON.stringify(model, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                    success = false;
                    continue;
                }

                assetPair.asset.idSystemObject = SO.idSystemObject;
                if (!await assetPair.asset.update()) {
                    LOG.error(`ingestData handleComplexIngestionScene unable to reassign model asset ${JSON.stringify(assetPair.asset, H.Helpers.saferStringify)} to Model ${JSON.stringify(model, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                    success = false;
                    continue;
                }

                const SOV: DBAPI.SystemObjectVersion = new DBAPI.SystemObjectVersion({
                    idSystemObject: SO.idSystemObject,
                    PublishedState: DBAPI.ePublishedState.eNotPublished,
                    DateCreated: new Date(),
                    idSystemObjectVersion: 0
                });
                if (!await SOV.create()) {
                    LOG.error(`ingestData handleComplexIngestionScene unable to create SystemObjectVersion ${JSON.stringify(SOV, H.Helpers.saferStringify)} for Model ${JSON.stringify(model, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                    success = false;
                    continue;
                }

                const SOVAVX: DBAPI.SystemObjectVersionAssetVersionXref = new DBAPI.SystemObjectVersionAssetVersionXref({
                    idSystemObjectVersion: SOV.idSystemObjectVersion,
                    idAssetVersion: assetPair.assetVersion.idAssetVersion,
                    idSystemObjectVersionAssetVersionXref: 0,
                });
                if (!await SOVAVX.create()) {
                    LOG.error(`ingestData handleComplexIngestionScene unable to create SystemObjectVersionAssetVersionXref ${JSON.stringify(SOVAVX, H.Helpers.saferStringify)} for Model ${JSON.stringify(model, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                    success = false;
                    continue;
                }
            }
        }

        return { success, transformUpdated };
    }

    extractSceneMetrics(scene: DBAPI.Scene, svxExtraction: SvxExtraction): void {
        const sceneExtract: DBAPI.Scene = svxExtraction.extractScene();
        scene.CountScene = sceneExtract.CountScene;
        scene.CountNode = sceneExtract.CountNode;
        scene.CountCamera = sceneExtract.CountCamera;
        scene.CountLight = sceneExtract.CountLight;
        scene.CountModel = sceneExtract.CountModel;
        scene.CountMeta = sceneExtract.CountMeta;
        scene.CountSetup = sceneExtract.CountSetup;
        scene.CountTour = sceneExtract.CountTour;
    }

    private async transformModelSceneXrefIntoModel(MSX: DBAPI.ModelSceneXref): Promise<DBAPI.Model> {
        const Name: string = MSX.Name ?? '';
        const vFileType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapModelFileByExtension(Name);
        const vPurpose: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eModelPurposeWebDelivery);
        return new DBAPI.Model({
            idModel: 0,
            Name,
            DateCreated: new Date(),
            idVCreationMethod: null,
            idVModality: null,
            idVPurpose: vPurpose ? vPurpose.idVocabulary : null,
            idVUnits: null,
            idVFileType: vFileType ? vFileType.idVocabulary : null,
            idAssetThumbnail: null, CountAnimations: null, CountCameras: null, CountFaces: null, CountLights: null, CountMaterials: null,
            CountMeshes: null, CountVertices: null, CountEmbeddedTextures: null, CountLinkedTextures: null, FileEncoding: null, IsDracoCompressed: null,
            AutomationTag: MSX.computeModelAutomationTag()
        });
    }

    private async createWorkflow(): Promise<IWorkflowHelper> {
        const workflowEngine: WF.IWorkflowEngine | null = await WF.WorkflowFactory.getInstance();
        if (!workflowEngine) {
            const error: string = 'ingestData createWorkflow could not load WorkflowEngine';
            LOG.error(error, LOG.LS.eGQL);
            return { success: false, error };
        }

        // Map asset versions to system object array
        const idSystemObject: number[] = [];
        for (const idObject of this.assetVersionSet.values()) {
            const oID: DBAPI.ObjectIDAndType = {
                idObject,
                eObjectType: DBAPI.eSystemObjectType.eAssetVersion,
            };
            const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
            if (SOI)
                idSystemObject.push(SOI.idSystemObject);
            else
                LOG.error(`ingestData createWorkflow unable to locate system object for ${JSON.stringify(oID)}`, LOG.LS.eGQL);
        }

        const wfParams: WF.WorkflowParameters = {
            eWorkflowType: CACHE.eVocabularyID.eWorkflowTypeIngestion,
            idSystemObject,
            idProject: null,    // TODO: populate with idProject
            idUserInitiator: this.user?.idUser ?? null,
            parameters: null,
        };

        const workflow: WF.IWorkflow | null = await workflowEngine.create(wfParams);
        if (!workflow) {
            const error: string = `ingestData createWorkflow unable to create Ingestion workflow: ${JSON.stringify(wfParams)}`;
            LOG.error(error, LOG.LS.eGQL);
            return { success: false, error };
        }

        const workflowReport: REP.IReport | null = await REP.ReportFactory.getReport();
        return { success: true, error: '', workflowEngine, workflow, workflowReport };
    }
}