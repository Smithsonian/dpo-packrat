import {
    IngestDataInput, IngestDataResult, MutationIngestDataArgs,
    IngestSubjectInput, IngestItemInput, IngestIdentifierInput, User,
    IngestPhotogrammetryInput, IngestModelInput, IngestSceneInput, IngestOtherInput, ExistingRelationship, RelatedObjectType,
    IngestSceneAttachmentInput
} from '../../../../../types/graphql';
import { ResolverBase, IWorkflowHelper } from '../../../ResolverBase';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import * as COL from '../../../../../collections/interface';
import * as META from '../../../../../metadata';
import * as LOG from '../../../../../utils/logger';
import * as H from '../../../../../utils/helpers';
import { SceneHelpers } from '../../../../../utils';
import * as WF from '../../../../../workflow/interface';
import * as REP from '../../../../../report/interface';
import * as NAV from '../../../../../navigation/interface';
import { AssetStorageAdapter, IngestAssetInput, IngestAssetResult, OperationInfo } from '../../../../../storage/interface';
import { VocabularyCache } from '../../../../../cache';
import { JobCookSIPackratInspectOutput } from '../../../../../job/impl/Cook';
import { RouteBuilder, eHrefMode } from '../../../../../http/routes/routeBuilder';
import { getRelatedObjects } from '../../../systemobject/resolvers/queries/getSystemObjectDetails';
import { PublishScene } from '../../../../../collections/impl/PublishScene';
import { NameHelpers, ModelHierarchy } from '../../../../../utils/nameHelpers';
import * as COMMON from '@dpo-packrat/common';
import { eSystemObjectType } from '@dpo-packrat/common';

type ModelInfo = {
    model: IngestModelInput;
    idModel: number;
    JCOutput: JobCookSIPackratInspectOutput;
};

type AssetVersionInfo = {
    SOOwner: DBAPI.SystemObjectBased;
    isAttachment: boolean;
    Comment: string | null;
};

type IdentifierResults = {
    success: boolean;
    identifierValue?: string;
    error?: string;
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
    private ICOL: COL.ICollection | undefined = undefined;

    private ingestPhotogrammetry: boolean = false;
    private ingestModel: boolean = false;
    private ingestScene: boolean = false;
    private ingestOther: boolean = false;
    private ingestAttachmentScene: boolean = false;

    private ingestNew: boolean = false;
    private ingestUpdate: boolean = false;
    private ingestAttachment: boolean = false;
    private assetVersionSet: Set<number> = new Set<number>(); // set of idAssetVersions

    private assetVersionMap: Map<number, AssetVersionInfo> = new Map<number, AssetVersionInfo>();                   // map from idAssetVersion -> system object that "owns" the asset, plus details for ingestion -- populated during creation of asset-owning objects below
    private ingestPhotoMap: Map<number, IngestPhotogrammetryInput> = new Map<number, IngestPhotogrammetryInput>();  // map from idAssetVersion -> photogrammetry input
    private ingestModelMap: Map<number, ModelInfo> = new Map<number, ModelInfo>();                                  // map from idAssetVersion -> model input, JCOutput, idModel

    private sceneSOI: DBAPI.SystemObjectInfo | undefined = undefined;

    private static vocabularyARK: DBAPI.Vocabulary | undefined = undefined;
    private static vocabularyEdanRecordID: DBAPI.Vocabulary | undefined = undefined;

    constructor(input: IngestDataInput, user: User | undefined) {
        super();
        this.input = input;
        this.user = user;
    }

    async ingest(): Promise<IngestDataResult> {
        const IDR: IngestDataResult = await this.ingestWorker();

        if (this.workflowHelper?.workflow)
            await this.workflowHelper.workflow.updateStatus(IDR.success ? COMMON.eWorkflowJobRunStatus.eDone : COMMON.eWorkflowJobRunStatus.eError);

        if (IDR.success)
            await this.appendToWFReport('<b>Ingest validation succeeded</b>');
        else
            await this.appendToWFReport(`<b>Ingest validation failed</b>: ${IDR.message}`);
        return IDR;
    }

    private async ingestWorker(): Promise<IngestDataResult> {
        LOG.info(`ingestData: input=${JSON.stringify(this.input, H.Helpers.saferStringify)}`, LOG.LS.eGQL);

        const results: H.IOResults = await this.validateInput();
        if (!results.success)
            return { success: results.success, message: results.error };

        this.workflowHelper = await this.createWorkflow(); // do this *after* this.validateInput, and *after* returning from validation failure, to avoid creating ingestion workflows that failed due to validation issues
        const subjectsDB: DBAPI.Subject[] = [];
        let itemDB: DBAPI.Item | null = null;
        if (this.ingestNew) {
            await this.appendToWFReport('Ingesting content for new object');

            let SOI: DBAPI.SystemObjectInfo | undefined = undefined;
            let path: string = '';
            let href: string = '';

            // retrieve/create subjects; if creating subjects, create related objects (Identifiers, possibly UnitEdan records, though unlikely)
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

                SOI = await CACHE.SystemObjectCache.getSystemFromSubject(subjectDB);
                path = SOI ? RouteBuilder.RepositoryDetails(SOI.idSystemObject, eHrefMode.ePrependClientURL) : '';
                href = H.Helpers.computeHref(path, subject.name);
                await this.appendToWFReport(`Subject ${href} (ARK ID ${subject.arkId}) ${subject.id ? 'validated' : 'created'}`);

                subjectsDB.push(subjectDB);
            }

            itemDB = await this.fetchOrCreateItem(this.input.item, subjectsDB);
            if (!itemDB)
                return { success: false, message: 'failure to retrieve or create media group' };

            SOI = await CACHE.SystemObjectCache.getSystemFromItem(itemDB);
            path = SOI ? RouteBuilder.RepositoryDetails(SOI.idSystemObject, eHrefMode.ePrependClientURL) : '';
            href = H.Helpers.computeHref(path, itemDB.Name);
            await this.appendToWFReport(`Packrat Media Group${!this.input.item.id ? ' (created)' : ''}: ${href}`);

            // wire projects to item
            if (this.input.project.id) {
                const projectDB: DBAPI.Project | null = await this.wireProjectToItem(this.input.project.id, itemDB);
                if (!projectDB)
                    return { success: false, message: 'failure to wire project to media group' };

                SOI = await CACHE.SystemObjectCache.getSystemFromProject(projectDB);
                path = SOI ? RouteBuilder.RepositoryDetails(SOI.idSystemObject, eHrefMode.ePrependClientURL) : '';
                href = H.Helpers.computeHref(path, this.input.project.name);
                await this.appendToWFReport(`Packrat Project: ${href}`);
            }

            // wire subjects to item
            if (!await this.wireSubjectsToItem(subjectsDB, itemDB))
                return { success: false, message: 'failure to wire subjects to media group' };
        } else if (this.ingestUpdate)
            await this.appendToWFReport('Ingesting content for updated object');
        else if (this.ingestAttachment)
            await this.appendToWFReport('Ingesting content for attachment');

        if (this.ingestPhotogrammetry) {
            for (const photogrammetry of this.input.photogrammetry) {
                if (!await this.createPhotogrammetryObjects(photogrammetry))
                    return { success: false, message: 'failure to create photogrammetry object' };
            }
        }

        if (this.ingestModel) {
            for (const model of this.input.model) {
                if (!await this.createModelObjects(model, itemDB, subjectsDB))
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

        if (this.ingestAttachmentScene) {
            for (const sceneAttachment of this.input.sceneAttachment) {
                if (!await this.createSceneAttachment(sceneAttachment))
                    return { success: false, message: 'failure to create scene attachment' };
            }
        }

        // next, promote asset into repository storage
        const { ingestResMap, transformUpdated } = await this.promoteAssetsIntoRepository();
        if (transformUpdated)
            modelTransformUpdated = true;

        // use results to create/update derived objects
        if (this.ingestPhotogrammetry)
            await this.createPhotogrammetryDerivedObjects(ingestResMap);

        if (this.ingestModel)
            await this.createModelDerivedObjects(ingestResMap);

        if (this.ingestOther)
            await this.createOtherDerivedObjects(ingestResMap);

        // wire item to asset-owning objects; do this *after* createModelDerivedObjects
        if (itemDB) {
            if (!await this.wireItemToAssetOwners(itemDB))
                return { success: false, message: 'failure to wire media group to asset owner' };

            await this.postItemWiring();
        }

        // notify workflow engine about this ingestion:
        if (!await this.sendWorkflowIngestionEvent(ingestResMap, modelTransformUpdated))
            return { success: false, message: 'failure to notify workflow engine about ingestion event' };
        return { success: true };
    }

    private getICollection(): COL.ICollection {
        if (!this.ICOL)
            this.ICOL = COL.CollectionFactory.getInstance();
        return this.ICOL;
    }

    private async getVocabularyARK(): Promise<DBAPI.Vocabulary | undefined> {
        if (!IngestDataWorker.vocabularyARK) {
            IngestDataWorker.vocabularyARK = await VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eIdentifierIdentifierTypeARK);
            if (!IngestDataWorker.vocabularyARK) {
                LOG.error('ingestData unable to fetch vocabulary for ARK Identifiers', LOG.LS.eGQL);
                return undefined;
            }
        }
        return IngestDataWorker.vocabularyARK;
    }

    private async getVocabularyEdanRecordID(): Promise<DBAPI.Vocabulary | undefined> {
        if (!IngestDataWorker.vocabularyEdanRecordID) {
            IngestDataWorker.vocabularyEdanRecordID = await VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eIdentifierIdentifierTypeEdanRecordID);
            if (!IngestDataWorker.vocabularyEdanRecordID) {
                LOG.error('ingestData unable to fetch vocabulary for Edan Record Identifiers', LOG.LS.eGQL);
                return undefined;
            }
        }
        return IngestDataWorker.vocabularyEdanRecordID;
    }

    private async validateIdentifiers(identifiers: IngestIdentifierInput[] | undefined): Promise<H.IOResults> {
        if (identifiers) {
            for (const identifier of identifiers) {
                const results: IdentifierResults = await this.validateIdentifier(identifier);
                if (!results.success) {
                    LOG.error(`ingestData failed to validate identifier ${JSON.stringify(identifier)}: ${results.error}`, LOG.LS.eGQL);
                    return { success: false, error: results.error ?? '' };
                }
            }
        }
        return { success: true };
    }

    private async validateIdentifier(identifier: IngestIdentifierInput): Promise<IdentifierResults> {
        // compute identifier; for ARKs, extract the ID from a URL that may be housing the ARK ID
        const vocabularyARK: DBAPI.Vocabulary | undefined = await this.getVocabularyARK();
        if (!vocabularyARK)
            return { success: false, error: 'Unable to compute ARK Vocabulary ID' };
        let identifierValue: string;
        if (identifier.identifierType == vocabularyARK.idVocabulary) {
            const arkId: string | null = this.getICollection().extractArkFromUrl(identifier.identifier);
            if (!arkId)
                return { success: false, error: `Invalid ark ${identifier.identifier}` };
            else
                identifierValue = arkId;
        } else
            identifierValue = identifier.identifier;
        return { success: true, identifierValue };
    }

    private async handleIdentifiers(SOBased: DBAPI.SystemObjectBased, systemCreated: boolean,
        identifiers: IngestIdentifierInput[] | undefined): Promise<boolean> {
        if (systemCreated) {
            if (!await this.createIdentifierForObject(null, SOBased)) {
                LOG.error(`ingestData unable to create system identifier for ${JSON.stringify(SOBased)}`, LOG.LS.eGQL);
                return false;
            }
        }

        if (identifiers && identifiers.length > 0) {
            for (const identifier of identifiers) {
                if (!await this.createIdentifierForObject(identifier, SOBased)) {
                    LOG.error(`ingestData unable to create identifier ${JSON.stringify(identifier)} for ${JSON.stringify(SOBased)}`, LOG.LS.eGQL);
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

        if (!identifier) {
            // create system identifier when needed
            const arkId: string = this.getICollection().generateArk(null, false);
            const identifierSystemDB: DBAPI.Identifier | null = await this.createIdentifier(arkId, SO, null, true);
            if (!identifierSystemDB) {
                LOG.error(`ingestData unable to create identifier record for object ${JSON.stringify(SOBased)}`, LOG.LS.eGQL);
                return false;
            } else
                return true;
        } else { // use identifier provided by user
            // compute identifier; for ARKs, extract the ID from a URL that may be housing the ARK ID
            const identiferResults: IdentifierResults = await this.validateIdentifier(identifier);
            if (!identiferResults.success || !identiferResults.identifierValue) {
                LOG.error(`ingestData failed to create an indentifier ${JSON.stringify(identifier)} for ${JSON.stringify(SOBased)}`, LOG.LS.eGQL);
                return false;
            }

            const identifierDB: DBAPI.Identifier | null = await this.createIdentifier(identiferResults.identifierValue, SO, identifier.identifierType, false);
            if (!identifierDB)
                return false;
        }
        return true;
    }

    private async createIdentifier(identifierValue: string, SO: DBAPI.SystemObject | null,
        idVIdentifierType: number | null, systemGenerated: boolean | null): Promise<DBAPI.Identifier | null> {
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

        const description: string = systemGenerated === true ? 'system generated' : (systemGenerated === false ? 'user-supplied' : 'system-supplied');
        if (!await identifier.create()) {
            const error: string = `ingestData unable to create identifier record for subject's identifier ${identifierValue}`;
            await this.appendToWFReport(`Identifier: ${identifierValue} (${description}) <b>creation failed</b>`);
            LOG.error(error, LOG.LS.eGQL);
            return null;
        }
        await this.appendToWFReport(`Identifier: ${identifierValue} (${description})`);
        return identifier;
    }

    private async validateOrCreateUnitEdan(units: DBAPI.Unit[] | null, Abbreviation: string): Promise<DBAPI.Unit | null> {
        if (!units || units.length == 0) {
            const unitEdanDB = new DBAPI.UnitEdan({
                idUnit: 1, // hard-coded for the 'Unknown Unit'
                Name: null,
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

    private async createSubject(idUnit: number, Name: string, identifierArkId: DBAPI.Identifier | null,
        identifierCollectionId: DBAPI.Identifier | null): Promise<DBAPI.Subject | null> {
        // create the subject
        const idIdentifierPreferred: number | null = (identifierArkId) ? identifierArkId.idIdentifier : (identifierCollectionId ? identifierCollectionId.idIdentifier : null);
        const subjectDB: DBAPI.Subject = new DBAPI.Subject({
            idUnit,
            idAssetThumbnail: null,
            idGeoLocation: null,
            Name,
            idIdentifierPreferred,
            idSubject: 0
        });
        if (!await subjectDB.create()) {
            LOG.error(`ingestData unable to create subject record with name ${Name}`, LOG.LS.eGQL);
            return null;
        }
        return subjectDB;
    }

    private async updateSubjectIdentifier(identifier: DBAPI.Identifier, SO: DBAPI.SystemObject): Promise<boolean> {
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

        return subjectDB;
    }

    private async createSubjectAndRelated(subject: IngestSubjectInput, units: DBAPI.Unit[] | null): Promise<DBAPI.Subject | null> {
        // identify Unit; create UnitEdan if needed
        // LOG.info(`ingestData.createSubjectAndRelated(${H.Helpers.JSONStringify(subject)})`, LOG.LS.eGQL);
        const unit: DBAPI.Unit | null = await this.validateOrCreateUnitEdan(units, subject.unit);
        if (!unit)
            return null;

        // create identifier
        let identifierArkId: DBAPI.Identifier | null = null;
        if (subject.arkId) {
            const vocabularyARK: DBAPI.Vocabulary | undefined = await this.getVocabularyARK();
            if (!vocabularyARK)
                return null;
            identifierArkId = await this.createIdentifier(subject.arkId, null, vocabularyARK.idVocabulary, null);
            if (!identifierArkId)
                return null;
        }

        let identifierCollectionId: DBAPI.Identifier | null = null;
        if (subject.collectionId) {
            const vocabularyEdanRecordID: DBAPI.Vocabulary | undefined = await this.getVocabularyEdanRecordID();
            if (!vocabularyEdanRecordID)
                return null;

            const identifier: string = subject.collectionId.toLowerCase().startsWith('edanmdm:') ? subject.collectionId : `edanmdm:${subject.collectionId}`;
            identifierCollectionId = await this.createIdentifier(identifier, null, vocabularyEdanRecordID.idVocabulary, null);
            if (!identifierCollectionId)
                return null;
        }

        // create the subject
        const subjectDB: DBAPI.Subject | null = await this.createSubject(unit.idUnit, subject.name, identifierArkId, identifierCollectionId);
        if (!subjectDB)
            return null;

        // update identifiers with systemobject ID of our subject
        const SO: DBAPI.SystemObject | null = await subjectDB.fetchSystemObject();
        if (SO) {
            if (identifierArkId && !await this.updateSubjectIdentifier(identifierArkId, SO))
                return null;
            if (identifierCollectionId && !await this.updateSubjectIdentifier(identifierCollectionId, SO))
                return null;
        } else
            LOG.error(`ingestData unable to fetch system object for subject record ${JSON.stringify(subjectDB)}`, LOG.LS.eGQL);

        return subjectDB;
    }

    private async wireProjectToItem(idProject: number, itemDB: DBAPI.Item): Promise<DBAPI.Project | null> {
        const projectDB: DBAPI.Project | null = await DBAPI.Project.fetch(idProject);
        if (!projectDB) {
            LOG.error(`ingestData unable to fetch project ${idProject}`, LOG.LS.eGQL);
            return null;
        }

        const xref: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(projectDB, itemDB);
        if (!xref) {
            LOG.error(`ingestData unable to wire project ${JSON.stringify(projectDB)} to item ${JSON.stringify(itemDB)}`, LOG.LS.eGQL);
            return null;
        }
        return projectDB;
    }

    private async fetchOrCreateItem(item: IngestItemInput, subjectsDB: DBAPI.Subject[]): Promise<DBAPI.Item | null> {
        let itemDB: DBAPI.Item | null;
        if (item.id) {
            itemDB = await DBAPI.Item.fetch(item.id);
            if (!itemDB)
                LOG.error(`ingestData could not compute item from ${item.id}`, LOG.LS.eGQL);
        } else {
            itemDB = new DBAPI.Item({
                idAssetThumbnail: null,
                idGeoLocation: null,
                Name: NameHelpers.mediaGroupDisplayName(item.name, item.subtitle, subjectsDB),
                EntireSubject: item.entireSubject,
                Title: item.subtitle,
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
        const vocabulary: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eCaptureDataCaptureMethodPhotogrammetry);
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
            CameraSettingsUniform: photogrammetry.cameraSettingUniform ? photogrammetry.cameraSettingUniform : false,
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
            this.assetVersionMap.set(photogrammetry.idAssetVersion, { SOOwner: captureDataDB, isAttachment: false, Comment: photogrammetry.updateNotes ?? null });
            this.ingestPhotoMap.set(photogrammetry.idAssetVersion, photogrammetry);
        }

        return true;
    }

    private async createPhotogrammetryDerivedObjects(ingestResMap: Map<number, IngestAssetResult | null>): Promise<boolean> {
        // create CaptureDataFile
        let res: boolean = true;
        for (const [idAssetVersion, AVInfo] of this.assetVersionMap) {
            const SOOwner: DBAPI.SystemObjectBased = AVInfo.SOOwner;
            if (!(SOOwner instanceof DBAPI.CaptureData))
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
                folderVariantMap.set(folder.name.toLowerCase(), folder?.variantType ?? 0);
                // LOG.info(`ingestData mapping ${folder.name.toLowerCase()} -> ${folder.variantType}`, LOG.LS.eGQL);
            }

            const SOParent: DBAPI.SystemObject | null = await SOOwner.fetchSystemObject();

            // build mapping of idAsset -> assetVersion
            const assetToVersionMap: Map<number, DBAPI.AssetVersion> = new Map<number, DBAPI.AssetVersion>(); // map of idAsset -> AssetVersion
            for (const assetVersion of ingestAssetRes.assetVersions || [])
                assetToVersionMap.set(assetVersion.idAsset, assetVersion);

            for (const asset of ingestAssetRes.assets || []) {
                const assetVersion: DBAPI.AssetVersion | undefined = assetToVersionMap.get(asset.idAsset);

                // map asset's file path to variant type
                let idVVariantType: number = 0;

                if (assetVersion) {
                    idVVariantType = folderVariantMap.get(assetVersion.FilePath.toLowerCase()) ?? 0;
                    if (!idVVariantType) {  // if that failed, try again with the last part of the path
                        let lastSlash: number = assetVersion.FilePath.lastIndexOf('/');
                        if (lastSlash === -1)
                            lastSlash = assetVersion.FilePath.lastIndexOf('\\');
                        const variantPath = assetVersion.FilePath.substring(lastSlash + 1).toLowerCase();

                        idVVariantType = folderVariantMap.get(variantPath) ?? 0;
                    }
                    // LOG.info(`ingestData mapped ${assetVersion.FilePath} to variant ${idVVariantType}`, LOG.LS.eGQL);
                }

                const CDF: DBAPI.CaptureDataFile = new DBAPI.CaptureDataFile({
                    idCaptureData: SOOwner.idCaptureData,
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

                // look up asset.idAsset -> assetVersion -> SO
                if (SOParent) {
                    const SOAssetVersion: DBAPI.SystemObject | null = assetVersion ? await assetVersion.fetchSystemObject() : null;

                    // gather metadata in extractor
                    // create metadata for variant type here
                    const vocabulary: DBAPI.Vocabulary | undefined = idVVariantType ? await CACHE.VocabularyCache.vocabulary(idVVariantType) : undefined;
                    if (vocabulary) {
                        const extractor: META.MetadataExtractor = new META.MetadataExtractor();
                        extractor.metadata.set('variant', vocabulary.Term);

                        if (SOAssetVersion) {
                            const results: H.IOResults = await META.MetadataManager.persistExtractor(SOAssetVersion.idSystemObject, SOParent.idSystemObject, extractor, this.user?.idUser ?? null);
                            if (!results.success)
                                LOG.error(`ingestData unable to persist capture data variant type metadata: ${results.error}`, LOG.LS.eGQL);
                        }
                    }
                }
            }
        }
        return res;
    }

    private async createModelObjects(model: IngestModelInput, itemDB: DBAPI.Item | null, subjectsDB: DBAPI.Subject[]): Promise<boolean> {
        const JCOutput: JobCookSIPackratInspectOutput | null = await JobCookSIPackratInspectOutput.extractFromAssetVersion(model.idAssetVersion);
        if (!JCOutput || !JCOutput.success || !JCOutput.modelConstellation || !JCOutput.modelConstellation.Model) {
            LOG.error(`ingestData createModelObjects failed to extract JobCookSIPackratInspectOutput from idAssetVersion ${model.idAssetVersion}`, LOG.LS.eGQL);
            return false;
        }

        // Examine model.idAsset; if Asset.idVAssetType -> model or model geometry file, then
        // Lookup SystemObject from Asset.idSystemObject; if idModel is not null, then use that idModel
        let idModel: number = 0;
        if (model.idAsset) {
            const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(model.idAssetVersion);
            if (!assetVersion) {
                LOG.error(`ingestData createModelObjects unable to fetch asset version from ${JSON.stringify(model, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                return false;
            }
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
            if (!asset) {
                LOG.error(`ingestData createModelObjects unable to fetch asset from ${JSON.stringify(model, H.Helpers.saferStringify)}, idAsset ${assetVersion.idAsset}`, LOG.LS.eGQL);
                return false;
            }

            const assetType: COMMON.eVocabularyID | undefined = await asset.assetType();
            if (assetType === COMMON.eVocabularyID.eAssetAssetTypeModel ||
                assetType === COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile) {
                const SO: DBAPI.SystemObject | null = asset.idSystemObject ? await DBAPI.SystemObject.fetch(asset.idSystemObject) : null;
                if (!SO) {
                    LOG.error(`ingestData createModelObjects unable to fetch model's asset's system object ${JSON.stringify(asset, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                    return false;
                }

                if (SO.idModel)                 // Is this a model?
                    idModel = SO.idModel;       // Yes: Use it!
            }
        }

        let modelDB: DBAPI.Model | null = idModel ? await DBAPI.Model.fetch(idModel) : null;
        let cloned: boolean = false;
        if (!modelDB)
            modelDB = JCOutput.modelConstellation.Model;
        else {
            modelDB.cloneData(JCOutput.modelConstellation.Model);
            cloned = true;
        }

        modelDB.Name = itemDB ? NameHelpers.modelDisplayName(model.subtitle, itemDB, subjectsDB) : model.subtitle;
        modelDB.Title = model.subtitle;
        modelDB.DateCreated = H.Helpers.convertStringToDate(model.dateCreated) || new Date();
        modelDB.idVCreationMethod = model.creationMethod;
        modelDB.idVModality = model.modality;
        modelDB.idVPurpose = model.purpose;
        modelDB.idVUnits = model.units;
        modelDB.idVFileType = model.modelFileType;

        // if we cloned, put our updates back into the modelConstellation ... as this may get used later
        if (cloned)
            JCOutput.modelConstellation.Model.cloneData(modelDB);

        const updateRes: boolean = idModel ? await modelDB.update() : await modelDB.create();
        if (!updateRes) {
            LOG.error(`ingestData createModelObjects unable to ${idModel ? 'update' : 'create'} model ${JSON.stringify(modelDB, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
            return false;
        }

        // LOG.info(`ingestData createModelObjects model=${JSON.stringify(model, H.Helpers.saferStringify)} vs asset=${JSON.stringify(asset, H.Helpers.saferStringify)}vs assetVersion=${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
        if (model.idAssetVersion) {
            this.assetVersionMap.set(model.idAssetVersion, { SOOwner: modelDB, isAttachment: false, Comment: model.updateNotes ?? null });
            const MI: ModelInfo = { model, idModel: modelDB.idModel, JCOutput };
            this.ingestModelMap.set(model.idAssetVersion, MI);
            LOG.info(`ingestData createModelObjects computed ${JSON.stringify(MI, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
        }

        return true;
    }

    // ingestResMap: map from idAssetVersion -> object that "owns" the asset
    private async createModelDerivedObjects(ingestResMap: Map<number, IngestAssetResult | null>): Promise<boolean> {
        // populate assetMap
        const assetMap: Map<string, number> = new Map<string, number>(); // Map of asset filename -> idAsset
        let ret: boolean = true;

        for (const [idAssetVersion, AVInfo] of this.assetVersionMap) {
            const SOOwner: DBAPI.SystemObjectBased = AVInfo.SOOwner;
            LOG.info(`ingestData createModelDerivedObjects considering idAssetVersion ${idAssetVersion}: ${JSON.stringify(SOOwner, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
            if (!(SOOwner instanceof DBAPI.Model))
                continue;
            const ingestAssetRes: IngestAssetResult | null | undefined = ingestResMap.get(idAssetVersion);
            if (!ingestAssetRes) {
                LOG.error(`ingestData createModelDerivedObjects unable to locate ingest results for idAssetVersion ${idAssetVersion}`, LOG.LS.eGQL);
                ret = false;
                continue;
            }
            if (!ingestAssetRes.success) {
                LOG.error(`ingestData createModelDerivedObjects failed for idAssetVersion ${idAssetVersion}: ${ingestAssetRes.error}`, LOG.LS.eGQL);
                ret = false;
                continue;
            }

            for (const asset of ingestAssetRes.assets || [])
                assetMap.set(asset.FileName, asset.idAsset);

            const modelInfo: ModelInfo | undefined = this.ingestModelMap.get(idAssetVersion);
            if (!modelInfo) {
                LOG.error(`ingestData createModelDerivedObjects unable to find model info for idAssetVersion ${idAssetVersion}`, LOG.LS.eGQL);
                ret = false;
                continue;
            }

            const model: IngestModelInput = modelInfo.model;
            const JCOutput: JobCookSIPackratInspectOutput = modelInfo.JCOutput;
            const idModel: number = modelInfo.idModel;

            if (!JCOutput.success || !JCOutput.modelConstellation || !JCOutput.modelConstellation.Model) {
                LOG.error(`ingestData createModelDerivedObjects unable to find valid model object results for idAssetVersion ${idAssetVersion}: ${JSON.stringify(JCOutput, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                ret = false;
                continue;
            }

            const res: H.IOResults = await JCOutput.persist(idModel, assetMap);
            if (!res.success) {
                LOG.error(`ingestData unable to create model constellation ${JSON.stringify(model)}: ${res.success}`, LOG.LS.eGQL);
                ret = false;
                continue;
            }
            const modelDB: DBAPI.Model = JCOutput.modelConstellation.Model; // retrieve again, as we may have swapped the object above, in JCOutput.persist
            this.assetVersionMap.set(idAssetVersion, { SOOwner: modelDB, isAttachment: false, Comment: AVInfo.Comment });

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
        }
        return ret;
    }

    private async createSceneObjects(scene: IngestSceneInput): Promise<{ success: boolean, transformUpdated?: boolean | undefined }> {
        // Examine scene.idAsset; if Asset.idVAssetType -> scene then
        // Lookup SystemObject from Asset.idSystemObject; if idScene is not null, then use that idScene
        const updateMode: boolean = (scene.idAsset != null && scene.idAsset > 0);
        let sceneDB: DBAPI.Scene | null = null;
        if (updateMode) {
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(scene.idAsset!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!asset) {
                LOG.error(`ingestData createSceneObjects unable to fetch scene's asset for ${JSON.stringify(scene, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                return { success: false };
            }
            const assetType: COMMON.eVocabularyID | undefined = await asset.assetType();
            if (assetType === COMMON.eVocabularyID.eAssetAssetTypeScene) {
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

        const sceneConstellation: DBAPI.SceneConstellation | null = await DBAPI.SceneConstellation.fetchFromAssetVersion(scene.idAssetVersion, scene.directory, sceneDB ? sceneDB.idScene : undefined);
        if (!sceneConstellation || !sceneConstellation.Scene)
            return { success: false };

        if (sceneDB === null)
            sceneDB = sceneConstellation.Scene;

        const MHs: ModelHierarchy[] | null = await NameHelpers.computeModelHierarchiesFromSourceObjects(scene.sourceObjects);
        sceneDB.Name = MHs ? NameHelpers.sceneDisplayName(scene.subtitle, MHs) : scene.subtitle;
        sceneDB.Title = scene.subtitle;
        sceneDB.ApprovedForPublication = scene.approvedForPublication;
        sceneDB.PosedAndQCd = scene.posedAndQCd;
        LOG.info(`ingestData createSceneObjects, updateMode=${updateMode}, sceneDB=${JSON.stringify(sceneDB, H.Helpers.saferStringify)}, sceneConstellation=${JSON.stringify(sceneConstellation, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
        let success: boolean = sceneDB.idScene ? await sceneDB.update() : await sceneDB.create();

        this.sceneSOI = await CACHE.SystemObjectCache.getSystemFromScene(sceneDB);
        const path: string = this.sceneSOI ? RouteBuilder.RepositoryDetails(this.sceneSOI.idSystemObject, eHrefMode.ePrependClientURL) : '';
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
                    LOG.error(`ingestData could not create ModelSceneXref for scene ${sceneDB.idScene}, as record already was populated: ${JSON.stringify(MSX)}`, LOG.LS.eGQL);
                    continue;
                }
                if (MSX.idModel <= 0) {
                    LOG.info(`ingestData could not create ModelSceneXref for scene ${sceneDB.idScene}, as model has not yet been ingested: ${JSON.stringify(MSX)}`, LOG.LS.eGQL);
                    continue;
                }

                // look for existing xref:
                const MSXExisting: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromModelAndScene(MSX.idModel, sceneDB.idScene);
                let MSXUpdate: DBAPI.ModelSceneXref | null = (MSXExisting && MSXExisting.length > 0) ? MSXExisting[0] : null;
                if (MSXUpdate) {
                    const { transformUpdated: transformUpdatedLocal, updated } = MSXUpdate.updateIfNeeded(MSX);
                    if (updated)
                        success = await MSXUpdate.update();
                    if (transformUpdatedLocal)
                        transformUpdated = true;
                } else {
                    MSX.idScene = sceneDB.idScene;
                    success = await MSX.create() && success;
                    MSXUpdate = MSX;
                }

                const modelDB: DBAPI.Model | null = await DBAPI.Model.fetch(MSXUpdate.idModel);
                if (!modelDB || !await DBAPI.SystemObjectXref.wireObjectsIfNeeded(sceneDB, modelDB)) {
                    LOG.error(`ingestData could not create SystemObjectXref for scene ${sceneDB.idScene} using: ${JSON.stringify(MSXUpdate)}`, LOG.LS.eGQL);
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
            this.assetVersionMap.set(scene.idAssetVersion, { SOOwner: sceneDB, isAttachment: false, Comment: scene.updateNotes ?? null });
        return { success, transformUpdated };
    }

    private async createOtherObjects(other: IngestOtherInput): Promise<boolean> {
        // "other" means we're simply creating an asset version (and associated asset)
        // fetch the associated asset and use that for identifiers
        // BUT ... populate this.assetVersionMap with the system object that owns the specified asset ... or if none, the asset itself.
        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(other.idAssetVersion);
        if (!assetVersion) {
            LOG.error(`ingestData could not fetch asset version for ${other.idAssetVersion}`, LOG.LS.eGQL);
            return false;
        }
        const idAsset: number = other.idAsset ?? assetVersion.idAsset;

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

            this.assetVersionMap.set(other.idAssetVersion, { SOOwner, isAttachment: false, Comment: other.updateNotes ?? null });
        }

        return true;
    }

    private async createOtherDerivedObjects(ingestResMap: Map<number, IngestAssetResult | null>): Promise<boolean> {
        let res: boolean = true;
        for (const idAssetVersion of this.assetVersionMap.keys()) {
            // LOG.info(`ingestData createOtherDerivedObjects idAssetVersion=${idAssetVersion}`, LOG.LS.eGQL);
            const ingestAssetRes: IngestAssetResult | null | undefined = ingestResMap.get(idAssetVersion);
            if (!ingestAssetRes) {
                LOG.error(`ingestData createOtherDerivedObjects unable to locate ingest results for idAssetVersion ${idAssetVersion}`, LOG.LS.eGQL);
                res = false;
                continue;
            }
            if (!ingestAssetRes.success) {
                LOG.error(`ingestData createOtherDerivedObjects failed for idAssetVersion ${idAssetVersion}: ${ingestAssetRes.error}`, LOG.LS.eGQL);
                res = false;
                continue;
            }

            const assetToVersionMap: Map<number, DBAPI.AssetVersion> = new Map<number, DBAPI.AssetVersion>(); // map of idAsset -> AssetVersion
            for (const assetVersion of ingestAssetRes.assetVersions || [])
                assetToVersionMap.set(assetVersion.idAsset, assetVersion);

            for (const asset of ingestAssetRes.assets || []) {
                const assetVersion: DBAPI.AssetVersion | undefined = assetToVersionMap.get(asset.idAsset);
                if (!assetVersion) {
                    LOG.error(`ingestData createOtherDerivedObjects could not fetch asset version for ${asset.idAsset}`, LOG.LS.eGQL);
                    res = false;
                    continue;
                }

                // if we're updating an existing asset, fetch variant metadata from the second-to-last version
                await this.extractAndReuseMetadata(assetVersion.idAsset, asset, assetVersion);
            }
        }
        return res;
    }

    private async postItemWiring(): Promise<boolean> {
        if (this.sceneSOI) {
            const metadataResult: H.IOResults = await PublishScene.extractSceneMetadata(this.sceneSOI.idSystemObject, this.user?.idUser ?? null);
            if (!metadataResult.success) {
                LOG.error(`ingestData unable to persist scene attachment metadata: ${metadataResult.error}`, LOG.LS.eGQL);
                return false;
            }
        }

        // explicitly reindex all owning system objects
        const nav: NAV.INavigation | null = await NAV.NavigationFactory.getInstance();
        if (!nav) {
            LOG.error('ingestData unable to fetch navigation interface', LOG.LS.eGQL);
            return false;
        }

        for (const AVInfo of this.assetVersionMap.values()) {
            const SO: DBAPI.SystemObject | null = await AVInfo.SOOwner.fetchSystemObject();
            if (!SO) {
                LOG.error(`ingestData unable to fetch system object for ${JSON.stringify(AVInfo.SOOwner, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                continue;
            }

            // index directly instead of scheduling indexing, so that we get an initial SOLR entry right away
            // NAV.NavigationFactory.scheduleObjectIndexing(SO.idSystemObject);
            const indexer: NAV.IIndexer | null = await nav.getIndexer();
            if (!indexer) {
                LOG.error(`ingestData unable to fetch navigation indexer for ${JSON.stringify(AVInfo.SOOwner, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                continue;
            }
            indexer.indexObject(SO.idSystemObject);
        }
        return true;
    }

    private async extractAndReuseMetadata(idAsset: number | null | undefined, asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion): Promise<boolean> {
        // LOG.info(`ingestData.extractAndReuseMetadata idAsset=${idAsset}, asset=${JSON.stringify(asset, H.Helpers.saferStringify)}, assetVersion=${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
        if (!idAsset)
            return true; // nothing to do

        // we have already created a new asset version for idAsset; find the next to last, if any, and use that to extract variant metadata
        const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchFromAsset(idAsset);
        if (!assetVersions) {
            LOG.error(`ingestData extractAndReuseMetadata could not fetch asset versions from asset ${idAsset}`, LOG.LS.eGQL);
            return false;
        }

        if (assetVersions.length < 2)
            return true;

        const assetVesionPenultimate: DBAPI.AssetVersion = assetVersions[assetVersions.length - 2];
        const SOAssetVersionPenultimate: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromAssetVersion(assetVesionPenultimate);
        if (!SOAssetVersionPenultimate) {
            LOG.error(`ingestData extractAndReuseMetadata could not fetch system object from asset version ${assetVesionPenultimate.idAssetVersion}`, LOG.LS.eGQL);
            return false;
        }

        const SOAssetVersionCurrent: DBAPI.SystemObject | null = await assetVersion.fetchSystemObject();
        if (!SOAssetVersionCurrent) {
            LOG.error(`ingestData extractAndReuseMetadata could not fetch system object from ${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
            return false;
        }

        const metadataList: DBAPI.Metadata[] | null = await DBAPI.Metadata.fetchFromSystemObject(SOAssetVersionPenultimate.idSystemObject);
        if (!metadataList) {
            LOG.error(`ingestData extractAndReuseMetadata could not fetch metadata for system object ${SOAssetVersionPenultimate.idSystemObject}`, LOG.LS.eGQL);
            return false;
        }

        for (const metadata of metadataList) {
            if (metadata.Name.toLowerCase() === 'variant') {
                // record metadata
                const extractor: META.MetadataExtractor = new META.MetadataExtractor();
                extractor.metadata.set('variant', metadata.ValueShort ?? metadata.ValueExtended ?? '');

                const results: H.IOResults = await META.MetadataManager.persistExtractor(SOAssetVersionCurrent.idSystemObject, asset.idSystemObject ?? SOAssetVersionPenultimate.idSystemObject,
                    extractor, this.user?.idUser ?? null);
                if (!results.success) {
                    LOG.error(`ingestData could not persist variant metadata for ${SOAssetVersionPenultimate.idSystemObject}: ${results.error}`, LOG.LS.eGQL);
                    return false;
                }

                return true;
            }
        }
        return true;
    }

    private async createSceneAttachment(sceneAttachment: IngestSceneAttachmentInput): Promise<boolean> {
        LOG.info(`ingestData.createSceneAttachment(${JSON.stringify(sceneAttachment)})`, LOG.LS.eGQL);
        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(sceneAttachment.idAssetVersion);
        if (!assetVersion) {
            LOG.error(`ingestData could not fetch asset version for ${sceneAttachment.idAssetVersion}`, LOG.LS.eGQL);
            return false;
        }

        const idAsset: number = assetVersion.idAsset;
        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(idAsset);
        if (!asset) {
            LOG.error(`ingestData could not fetch asset for ${idAsset}`, LOG.LS.eGQL);
            return false;
        }

        if (!await this.handleIdentifiers(asset, sceneAttachment.systemCreated, sceneAttachment.identifiers))
            return false;

        // if the asset version is an attachment to a specific system object, use that system object as the owner of the new asset version
        let SOOwner: DBAPI.SystemObjectBased | null = null;
        if (assetVersion.idSOAttachment) {
            const SOP: DBAPI.SystemObjectPairs | null = await DBAPI.SystemObjectPairs.fetch(assetVersion.idSOAttachment);
            if (!SOP) {
                LOG.error(`ingestData could not fetch system object pairs from ${JSON.stringify(asset, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                return false;
            }
            SOOwner = SOP.SystemObjectBased;
        }
        if (!SOOwner)
            SOOwner = asset;

        const SOAssetVersion: DBAPI.SystemObject | null = await assetVersion.fetchSystemObject();
        if (!SOAssetVersion) {
            LOG.error(`ingestData could not fetch system object from ${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
            return false;
        }

        // record metadata
        const idSOParent: number = assetVersion.idSOAttachment ? assetVersion.idSOAttachment : SOAssetVersion.idSystemObject;
        const results: H.IOResults = await SceneHelpers.recordAttachmentMetadata(sceneAttachment, SOAssetVersion.idSystemObject, idSOParent, this.user?.idUser ?? null);
        if (!results.success)
            LOG.error('ingestData could not persist attachment metadata', LOG.LS.eGQL);

        this.assetVersionMap.set(sceneAttachment.idAssetVersion, { SOOwner, isAttachment: true, Comment: null }); // store attachment without unzipping
        return true;
    }

    private async wireItemToAssetOwners(itemDB: DBAPI.Item): Promise<boolean> {
        for (const AVInfo of this.assetVersionMap.values()) {
            const SOOwner: DBAPI.SystemObjectBased = AVInfo.SOOwner;
            const xref: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(itemDB, SOOwner);
            if (!xref) {
                LOG.error(`ingestData unable to wire item ${JSON.stringify(itemDB)} to asset owner ${JSON.stringify(SOOwner)}`, LOG.LS.eGQL);
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
        for (const [idAssetVersion, AVInfo] of this.assetVersionMap) {
            const SOBased: DBAPI.SystemObjectBased = AVInfo.SOOwner;

            // LOG.info(`ingestData.promoteAssetsIntoRepository ${idAssetVersion} -> ${JSON.stringify(SOOwner)}`, LOG.LS.eGQL);
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

            await this.appendToWFReport(`Ingesting ${assetVersionDB.FileName}, size ${assetVersionDB.StorageSize}, hash ${assetVersionDB.StorageHash}`);

            // LOG.info(`ingestData.promoteAssetsIntoRepository AssetVersion=${JSON.stringify(assetVersionDB, H.Helpers.saferStringify)}; Asset=${JSON.stringify(assetDB, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
            const opInfo: OperationInfo = {
                message: AVInfo.Comment ? AVInfo.Comment : 'Ingesting asset',
                idUser: user.idUser,
                userEmailAddress: user.EmailAddress,
                userName: user.Name
            };
            const ingestAssetInput: IngestAssetInput = {
                asset: assetDB,
                assetVersion: assetVersionDB,
                allowZipCracking: !AVInfo.isAttachment, // don't unzip attachments
                SOBased,
                idSystemObject: null,
                opInfo,
                Comment: AVInfo.Comment,
                doNotSendIngestionEvent: true
            };

            const IAR: IngestAssetResult = await AssetStorageAdapter.ingestAsset(ingestAssetInput);
            if (!IAR.success) {
                LOG.error(`ingestData unable to ingest assetVersion ${idAssetVersion}: ${IAR.error}`, LOG.LS.eGQL);
                await this.appendToWFReport(`<b>Asset Ingestion Failed</b>: ${IAR.error}`);
            } else {
                if (IAR.assetVersions) {
                    for (const assetVersion of IAR.assetVersions) {
                        const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromAssetVersion(assetVersion);
                        const pathObject: string = SOI ? RouteBuilder.RepositoryDetails(SOI.idSystemObject, eHrefMode.ePrependClientURL) : '';
                        const hrefObject: string = H.Helpers.computeHref(pathObject, assetVersion.FileName);
                        const pathDownload: string = RouteBuilder.DownloadAssetVersion(assetVersion.idAssetVersion, eHrefMode.ePrependServerURL);
                        const hrefDownload: string = H.Helpers.computeHref(pathDownload, 'Download');
                        await this.appendToWFReport(`Ingested ${hrefObject}: ${hrefDownload}, size ${assetVersion.StorageSize}, hash ${assetVersion.StorageHash}`);
                    }
                }
                if (IAR.assets) {
                    // Handle complex ingestion, such as ingestion of a scene package as a zip file.
                    // In this case, we will receive the scene .svx.json file, supporting HTML, images, CSS, as well as models.
                    // Each model asset needs a Model and ModelSceneXref, and the asset in question should be owned by the model.
                    if (!AVInfo.isAttachment && SOBased instanceof DBAPI.Scene) {
                        const { success, transformUpdated: modelTransformUpdated } = await SceneHelpers.handleComplexIngestionScene(SOBased, IAR, user.idUser, idAssetVersion);
                        if (success && modelTransformUpdated) {
                            transformUpdated = true;
                            LOG.info(`ingestData set transformUpdated to true from idAssetVersion ${idAssetVersion} for ${JSON.stringify(SOBased, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                        }
                    }
                }
            }
            ingestResMap.set(idAssetVersion, IAR);
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

        // prepare to wire together ingestion workflow step with output asset versions (in systemObjectSet)
        const WFC: DBAPI.WorkflowConstellation | null = (this.workflowHelper && this.workflowHelper.workflow)
            ? await this.workflowHelper.workflow.workflowConstellation() : null;
        const workflowSteps: DBAPI.WorkflowStep[] | null = WFC ? WFC.workflowStep : null;
        const workflowStep: DBAPI.WorkflowStep | null = (workflowSteps && workflowSteps.length > 0) ? workflowSteps[workflowSteps.length - 1] : null;

        // compute set of unique asset versions ingested:
        let ret: boolean = true;
        for (const IAR of ingestResMap.values()) {
            if (!IAR || !IAR.assetVersions)
                continue;

            const systemObjectSet: Set<number> = new Set<number>();
            for (const assetVersion of IAR.assetVersions) {
                const oID: DBAPI.ObjectIDAndType = { idObject: assetVersion.idAssetVersion, eObjectType: COMMON.eSystemObjectType.eAssetVersion };
                const sysInfo: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
                if (!sysInfo) {
                    LOG.error(`ingestData sendWorkflowIngestionEvent could not find system object for ${JSON.stringify(oID)}`, LOG.LS.eGQL);
                    ret = false;
                    continue;
                }
                systemObjectSet.add(sysInfo.idSystemObject);
            }

            const idSystemObject: number[] = [];
            for (const idSystemObjectDistinct of systemObjectSet.values()) {
                idSystemObject.push(idSystemObjectDistinct);
                if (workflowStep) {
                    const WSSOX: DBAPI.WorkflowStepSystemObjectXref = new DBAPI.WorkflowStepSystemObjectXref({
                        idWorkflowStep: workflowStep.idWorkflowStep,
                        idSystemObject: idSystemObjectDistinct,
                        Input: false,
                        idWorkflowStepSystemObjectXref: 0
                    });
                    if (!await WSSOX.create())
                        LOG.error(`ingestData sendWorkflowIngestionEvent failed to create WorkflowStepSystemObjectXref ${JSON.stringify(WSSOX, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
                }
            }

            let message: string = 'Sending WorkflowEngine IngestObject event';
            if (IAR.systemObjectVersion?.idSystemObject) {
                const pathObject: string = RouteBuilder.RepositoryDetails(IAR.systemObjectVersion.idSystemObject, eHrefMode.ePrependClientURL);
                const hrefObject: string = H.Helpers.computeHref(pathObject, `System Object ${IAR.systemObjectVersion.idSystemObject}`);
                message += ` for ${hrefObject}`;
            }
            await this.appendToWFReport(message);

            const parameters = {
                modelTransformUpdated,
                assetsIngested: IAR.assetsIngested
            };

            const workflowParams: WF.WorkflowParameters = {
                idSystemObject,
                // idProject: TODO: update with project ID
                idUserInitiator: user.idUser,
                parameters
            };

            // send workflow engine event, but don't wait for results
            workflowEngine.event(COMMON.eVocabularyID.eWorkflowEventIngestionIngestObject, workflowParams);
        }

        return ret;
    }

    async validateInput(): Promise<H.IOResults> {
        this.ingestPhotogrammetry   = this.input.photogrammetry && this.input.photogrammetry.length > 0;
        this.ingestModel            = this.input.model && this.input.model.length > 0;
        this.ingestScene            = this.input.scene && this.input.scene.length > 0;
        this.ingestOther            = this.input.other && this.input.other.length > 0;
        this.ingestAttachmentScene  = this.input.sceneAttachment && this.input.sceneAttachment.length > 0;
        this.ingestNew              = false;
        this.ingestUpdate           = false;

        if (this.ingestPhotogrammetry) {
            for (const photogrammetry of this.input.photogrammetry) {
                // add validation in this area while we iterate through the objects
                if (photogrammetry.sourceObjects && photogrammetry.sourceObjects.length) {
                    for (const sourceObject of photogrammetry.sourceObjects) {
                        if (!isValidParentChildRelationship(sourceObject.objectType, COMMON.eSystemObjectType.eCaptureData, photogrammetry.sourceObjects, [], true)) {
                            const error: string = `ingestData will not create the inappropriate parent-child relationship between ${COMMON.eSystemObjectType[sourceObject.objectType]} and capture data`;
                            LOG.error(error, LOG.LS.eGQL);
                            return { success: false, error };
                        }
                    }
                }

                if (photogrammetry.derivedObjects && photogrammetry.derivedObjects.length) {
                    for (const derivedObject of photogrammetry.derivedObjects) {
                        const sourceObjectsOfChild = await getRelatedObjects(derivedObject.idSystemObject, RelatedObjectType.Source);
                        if (!isValidParentChildRelationship(COMMON.eSystemObjectType.eCaptureData, derivedObject.objectType, [], sourceObjectsOfChild, false)) {
                            const error: string = `ingestData will not create the inappropriate parent-child relationship between capture data and ${COMMON.eSystemObjectType[derivedObject.objectType]}`;
                            LOG.error(error, LOG.LS.eGQL);
                            return { success: false, error };
                        }
                    }
                }

                const identiferResults: H.IOResults = await this.validateIdentifiers(photogrammetry.identifiers);
                if (!identiferResults.success)
                    return identiferResults;

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
                // add validation in this area while we iterate through the objects
                if (model.sourceObjects && model.sourceObjects.length) {
                    for (const sourceObject of model.sourceObjects) {
                        if (!isValidParentChildRelationship(sourceObject.objectType, COMMON.eSystemObjectType.eModel, model.sourceObjects, [], true)) {
                            const error: string = `ingestData will not create the inappropriate parent-child relationship between ${COMMON.eSystemObjectType[sourceObject.objectType]} and model`;
                            LOG.error(error, LOG.LS.eGQL);
                            return { success: false, error };
                        }
                    }
                }

                if (model.derivedObjects && model.derivedObjects.length) {
                    for (const derivedObject of model.derivedObjects) {
                        const sourceObjectsOfChild = await getRelatedObjects(derivedObject.idSystemObject, RelatedObjectType.Source);
                        if (!isValidParentChildRelationship(COMMON.eSystemObjectType.eModel, derivedObject.objectType, [], sourceObjectsOfChild, false)) {
                            const error: string = `ingestData will not create the inappropriate parent-child relationship between model and ${COMMON.eSystemObjectType[derivedObject.objectType]}`;
                            LOG.error(error, LOG.LS.eGQL);
                            return { success: false, error };
                        }
                    }
                }

                const identiferResults: H.IOResults = await this.validateIdentifiers(model.identifiers);
                if (!identiferResults.success)
                    return identiferResults;

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
                // add validation in this area while we iterate through the objects
                // we only care about scene having a model parent if it's not an update (i.e. if it doesn't have an idAsset)
                if (typeof scene.idAsset !== 'number' && (!scene.sourceObjects || !scene.sourceObjects.length || !scene.sourceObjects.some(sourceObj => sourceObj.objectType === eSystemObjectType.eModel)))
                    return { success: false, error: 'Scene ingestion must have at least 1 source object of type model' };
                if (scene.sourceObjects && scene.sourceObjects.length) {
                    for (const sourceObject of scene.sourceObjects) {
                        if (!isValidParentChildRelationship(sourceObject.objectType, COMMON.eSystemObjectType.eScene, scene.sourceObjects, [], true)) {
                            const error: string = `ingestData will not create the inappropriate parent-child relationship between ${COMMON.eSystemObjectType[sourceObject.objectType]} and scene`;
                            LOG.error(error, LOG.LS.eGQL);
                            return { success: false, error };
                        }
                    }
                }

                if (scene.derivedObjects && scene.derivedObjects.length) {
                    for (const derivedObject of scene.derivedObjects) {
                        const sourceObjectsOfChild = await getRelatedObjects(derivedObject.idSystemObject, RelatedObjectType.Source);
                        if (!isValidParentChildRelationship(COMMON.eSystemObjectType.eScene, derivedObject.objectType, [], sourceObjectsOfChild, false)) {
                            const error: string = `ingestData will not create the inappropriate parent-child relationship between scene and ${COMMON.eSystemObjectType[derivedObject.objectType]}`;
                            LOG.error(error, LOG.LS.eGQL);
                            return { success: false, error };
                        }
                    }
                }

                const identiferResults: H.IOResults = await this.validateIdentifiers(scene.identifiers);
                if (!identiferResults.success)
                    return identiferResults;

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
                const identiferResults: H.IOResults = await this.validateIdentifiers(other.identifiers);
                if (!identiferResults.success)
                    return identiferResults;

                if (other.idAssetVersion)
                    this.assetVersionSet.add(other.idAssetVersion);
                if (other.idAsset)
                    this.ingestUpdate = true;
                else
                    this.ingestNew = true;
            }
        }

        if (this.ingestAttachmentScene) {
            this.ingestAttachment = true;
            for (const sceneAttachment of this.input.sceneAttachment) {
                const identiferResults: H.IOResults = await this.validateIdentifiers(sceneAttachment.identifiers);
                if (!identiferResults.success)
                    return identiferResults;

                if (sceneAttachment.idAssetVersion)
                    this.assetVersionSet.add(sceneAttachment.idAssetVersion);
            }
        }

        // data validation; FYI ... this.input.project is allowed to be unspecified
        const flavors: number = (this.ingestNew ? 1 : 0) + (this.ingestUpdate ? 1 : 0) + (this.ingestAttachment ? 1 : 0);
        if (flavors > 1) {
            const error: string = 'ingestData called with an unsupported mix of additions, updates, and attachments';
            LOG.error(error, LOG.LS.eGQL);
            return { success: false, error };
        }

        if (flavors === 0) {
            const error: string = 'ingestData called without one of additions, updates, or attachments';
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
                const error: string = 'ingestData called with no media group';
                LOG.error(error, LOG.LS.eGQL);
                return { success: false, error };
            }
        }

        if (!this.user) {
            const error: string = 'ingestData unable to retrieve user context';
            LOG.error(error, LOG.LS.eGQL);
            return { success: false, error };
        }
        return { success: true };
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
                eObjectType: COMMON.eSystemObjectType.eAssetVersion,
            };
            const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
            if (SOI)
                idSystemObject.push(SOI.idSystemObject);
            else
                LOG.error(`ingestData createWorkflow unable to locate system object for ${JSON.stringify(oID)}`, LOG.LS.eGQL);
        }

        const wfParams: WF.WorkflowParameters = {
            eWorkflowType: COMMON.eVocabularyID.eWorkflowTypeIngestion,
            idSystemObject,
            // idProject: TODO: populate with idProject
            idUserInitiator: this.user?.idUser,
        };

        const workflow: WF.IWorkflow | null = await workflowEngine.create(wfParams);
        if (!workflow) {
            const error: string = `ingestData createWorkflow unable to create Ingestion workflow: ${JSON.stringify(wfParams)}`;
            LOG.error(error, LOG.LS.eGQL);
            return { success: false, error };
        }

        const workflowReport: REP.IReport | null = await REP.ReportFactory.getReport();
        return { success: true, workflowEngine, workflow, workflowReport };
    }
}

export function isValidParentChildRelationship(parent: COMMON.eSystemObjectType, child: COMMON.eSystemObjectType, selected: ExistingRelationship[], existingParentRelationships: ExistingRelationship[], isAddingSource: boolean): boolean {
    let result = false;
    /*
        *NOTE: when updating this relationship validation function,
        make sure to also apply changes to the client-side version located at
        ingestData.ts to maintain consistency; ObjectGraph.ts also has it's own version of this logic,
        in a different form.
        **NOTE: this server-side validation function will be validating a selected item AFTER adding it,
        which means the maximum connection count will be different from those seen in repository.tsx
    */

    const existingAndNewRelationships = [...existingParentRelationships, ...selected];
    switch (child) {
        case COMMON.eSystemObjectType.eUnit:
        case COMMON.eSystemObjectType.eProject:
        case COMMON.eSystemObjectType.eSubject:
        case COMMON.eSystemObjectType.eAsset:
        case COMMON.eSystemObjectType.eAssetVersion:
            break;

        case COMMON.eSystemObjectType.eItem:
            if (parent === COMMON.eSystemObjectType.eSubject)
                result = true;
            else if (parent === COMMON.eSystemObjectType.eProject)
                result = maximumConnections(existingAndNewRelationships, COMMON.eSystemObjectType.eProject, isAddingSource ? 2 : 1);
            break;

        case COMMON.eSystemObjectType.eCaptureData:
            if (parent === COMMON.eSystemObjectType.eCaptureData || parent === COMMON.eSystemObjectType.eItem)
                result = true;
            break;

        case COMMON.eSystemObjectType.eModel:
            if (parent === COMMON.eSystemObjectType.eScene)
                result = maximumConnections(existingAndNewRelationships, COMMON.eSystemObjectType.eScene, isAddingSource ? 2 : 1);
            else if (parent === COMMON.eSystemObjectType.eCaptureData || parent === COMMON.eSystemObjectType.eModel || parent === COMMON.eSystemObjectType.eItem)
                result = true;
            break;

        case COMMON.eSystemObjectType.eScene:
            if (parent === COMMON.eSystemObjectType.eItem || parent === COMMON.eSystemObjectType.eModel)
                result = true;
            break;

        case COMMON.eSystemObjectType.eIntermediaryFile:
            if (parent === COMMON.eSystemObjectType.eItem)
                result = true;
            break;

        case COMMON.eSystemObjectType.eProjectDocumentation:
            if (parent === COMMON.eSystemObjectType.eProject)
                result = true;
            break;

        case COMMON.eSystemObjectType.eActor:
            if (parent === COMMON.eSystemObjectType.eCaptureData ||
                parent === COMMON.eSystemObjectType.eModel ||
                parent === COMMON.eSystemObjectType.eScene ||
                parent === COMMON.eSystemObjectType.eIntermediaryFile ||
                parent === COMMON.eSystemObjectType.eUnit)
                result = true;
            break;

        case COMMON.eSystemObjectType.eStakeholder:
            if (parent === COMMON.eSystemObjectType.eUnit || parent === COMMON.eSystemObjectType.eProject)
                result = true;
            break;
    }

    return result;
}

const maximumConnections = (relationships: ExistingRelationship[], objectType: COMMON.eSystemObjectType, limit: number) => relationships.filter(relationship => relationship.objectType === objectType).length < limit;
