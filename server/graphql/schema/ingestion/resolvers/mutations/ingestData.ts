import { IngestDataResult, MutationIngestDataArgs, IngestSubjectInput, IngestItemInput, IngestPhotogrammetry, IngestModelInput, IngestIdentifier, User, IngestPhotogrammetryInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import * as COL from '../../../../../collections/interface';
import * as LOG from '../../../../../utils/logger';
import * as H from '../../../../../utils/helpers';
import { AssetStorageAdapter, IngestAssetResult, OperationInfo } from '../../../../../storage/interface';
import { VocabularyCache, eVocabularyID } from '../../../../../cache';
import { JobCookSIPackratInspectOutput } from '../../../../../job/impl/Cook';

export default async function ingestData(_: Parent, args: MutationIngestDataArgs, context: Context): Promise<IngestDataResult> {
    const { input } = args;
    const { user } = context;

    // data validation; FYI ... input.project is allowed to be unspecified
    if (!input.subjects || input.subjects.length == 0) {
        LOG.error('ingestData called with no subjects', LOG.LS.eGQL);
        return { success: false };
    }

    if (!input.item) {
        LOG.error('ingestData called with no item', LOG.LS.eGQL);
        return { success: false };
    }

    if (!user) {
        LOG.error('ingestData unable to retrieve user context', LOG.LS.eGQL);
        return { success: false };
    }

    // retrieve/create subjects; if creating subjects, create related objects (Identifiers, possibly UnitEdan records, though unlikely)
    const subjectsDB: DBAPI.Subject[] = [];
    for (const subject of input.subjects) {
        // fetch our understanding of EDAN's unit information:
        const units: DBAPI.Unit[] | null = await DBAPI.Unit.fetchFromNameSearch(subject.unit);
        let subjectDB: DBAPI.Subject | null = null;

        if (subject.id)     // if this subject exists, validate it
            subjectDB = await validateExistingSubject(subject, units);
        else                // otherwise create it and related objects, including possibly units
            subjectDB = await createSubjectAndRelated(subject, units);

        if (!subjectDB)
            return { success: false };
        subjectsDB.push(subjectDB);
    }

    // wire projects to subjects
    if (input.project.id && !(await wireProjectToSubjects(input.project.id, subjectsDB)))
        return { success: false };

    const itemDB: DBAPI.Item | null = await fetchOrCreateItem(input.item);
    if (!itemDB)
        return { success: false };

    // wire subjects to item
    if (!await wireSubjectsToItem(subjectsDB, itemDB))
        return { success: false };

    const ingestPhotogrammetry: boolean = input.photogrammetry && input.photogrammetry.length > 0;
    const ingestModel: boolean = input.model && input.model.length > 0;
    const assetVersionMap: Map<number, DBAPI.SystemObjectBased> = new Map<number, DBAPI.SystemObjectBased>(); // map from idAssetVersion -> object that "owns" the asset -- populated during creation of asset-owning objects below
    const ingestPhotoMap: Map<number, IngestPhotogrammetryInput> = new Map<number, IngestPhotogrammetryInput>(); // map from idAssetVersion -> photogrammetry input
    // create photogrammetry objects, if needed
    if (ingestPhotogrammetry) {
        for (const photogrammetry of input.photogrammetry) {
            const captureDataDB: DBAPI.CaptureData | null = await createPhotogrammetryObjects(photogrammetry);
            if (!captureDataDB)
                return { success: false };
            if (photogrammetry.idAssetVersion) {
                assetVersionMap.set(photogrammetry.idAssetVersion, captureDataDB);
                ingestPhotoMap.set(photogrammetry.idAssetVersion, photogrammetry);
            }
        }
    }

    if (ingestModel) {
        for (const model of input.model) {
            if (!await createModelObjects(model, assetVersionMap))
                return { success: false };
        }
    }

    // wire item to asset-owning objects
    if (!await wireItemToAssetOwners(itemDB, assetVersionMap))
        return { success: false };

    // next, promote asset into repository storage
    const ingestRes: Map<number, IngestAssetResult | null> = await promoteAssetsIntoRepository(assetVersionMap, user);

    // finally, use results to create/update derived objects
    if (ingestPhotogrammetry) {
        await createPhotogrammetryDerivedObjects(assetVersionMap, ingestPhotoMap, ingestRes);
    }

    return { success: true };
}

let vocabularyARK: DBAPI.Vocabulary | undefined = undefined;
async function getVocabularyARK(): Promise<DBAPI.Vocabulary | undefined> {
    if (!vocabularyARK) {
        vocabularyARK = await VocabularyCache.vocabularyByEnum(eVocabularyID.eIdentifierIdentifierTypeARK);
        if (!vocabularyARK) {
            LOG.error('ingestData unable to fetch vocabulary for ARK Identifiers', LOG.LS.eGQL);
            return undefined;
        }
    }
    return vocabularyARK;
}

/**  */
async function createIdentifier(identifierValue: string, SO: DBAPI.SystemObject | null, idVIdentifierType: number | null): Promise<DBAPI.Identifier | null> {
    if (!idVIdentifierType) {
        const vocabularyARK: DBAPI.Vocabulary | undefined = await getVocabularyARK();
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
        LOG.error(`ingestData unable to create identifier record for subject's arkId ${identifierValue}`, LOG.LS.eGQL);
        return null;
    }
    return identifier;
}

async function createIdentifierForObject(identifier: IngestIdentifier | null, SOBased: DBAPI.SystemObjectBased): Promise<boolean> {
    const SO: DBAPI.SystemObject | null = await SOBased.fetchSystemObject();
    if (!SO) {
        LOG.error(`ingestData unable to fetch system object from ${JSON.stringify(SOBased)}`, LOG.LS.eGQL);
        return false;
    }

    const ICOL: COL.ICollection = COL.CollectionFactory.getInstance();

    if (!identifier) {
        // create system identifier when needed
        const arkId: string = ICOL.generateArk(null, false);
        const identifierSystemDB: DBAPI.Identifier | null = await createIdentifier(arkId, SO, null);
        if (!identifierSystemDB) {
            LOG.error(`ingestData unable to create identifier record for object ${JSON.stringify(SOBased)}`, LOG.LS.eGQL);
            return false;
        } else
            return true;
    } else {
        // use identifier provided by use

        // compute identifier; for ARKs, extract the ID from a URL that may be housing the ARK ID
        const vocabularyARK: DBAPI.Vocabulary | undefined = await getVocabularyARK();
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

        const identifierDB: DBAPI.Identifier | null = await createIdentifier(IdentifierValue, SO, identifier.identifierType);
        if (!identifierDB)
            return false;
    }
    return true;
}

async function validateOrCreateUnitEdan(units: DBAPI.Unit[] | null, Abbreviation: string): Promise<DBAPI.Unit | null> {
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

async function createSubject(idUnit: number, Name: string, identifier: DBAPI.Identifier | null): Promise<DBAPI.Subject | null> {
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

async function updateIdentifier(identifier: DBAPI.Identifier | null, subjectDB: DBAPI.Subject): Promise<boolean> {
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

async function validateExistingSubject(subject: IngestSubjectInput, units: DBAPI.Unit[] | null): Promise<DBAPI.Subject | null> {
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

async function createSubjectAndRelated(subject: IngestSubjectInput, units: DBAPI.Unit[] | null): Promise<DBAPI.Subject | null> {
    // identify Unit; create UnitEdan if needed
    const unit: DBAPI.Unit | null = await validateOrCreateUnitEdan(units, subject.unit);
    if (!unit)
        return null;

    // create identifier
    let identifier: DBAPI.Identifier | null = null;
    if (subject.arkId) {
        identifier = await createIdentifier(subject.arkId, null, null);
        if (!identifier)
            return null;
    }

    // create the subject
    const subjectDB: DBAPI.Subject | null = await createSubject(unit.idUnit, subject.name, identifier);
    if (!subjectDB)
        return null;

    // update identifier, if it exists with systemobject ID of our subject
    if (!await updateIdentifier(identifier, subjectDB))
        return null;

    return subjectDB;
}

async function wireProjectToSubjects(idProject: number, subjectsDB: DBAPI.Subject[]): Promise<boolean> {
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

async function fetchOrCreateItem(item: IngestItemInput): Promise<DBAPI.Item | null> {
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

async function wireSubjectsToItem(subjectsDB: DBAPI.Subject[], itemDB: DBAPI.Item): Promise<boolean> {
    for (const subjectDB of subjectsDB) {
        const xref: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(subjectDB, itemDB);
        if (!xref) {
            LOG.error(`ingestData unable to wire subject ${JSON.stringify(subjectDB)} to item ${JSON.stringify(itemDB)}`, LOG.LS.eGQL);
            return false;
        }
    }
    return true;
}

async function createPhotogrammetryObjects(photogrammetry: IngestPhotogrammetry): Promise<DBAPI.CaptureData | null> {
    const vocabulary: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eCaptureDataCaptureMethodPhotogrammetry);
    if (!vocabulary) {
        LOG.error('ingestData unable to retrieve photogrammetry capture method vocabulary from cache', LOG.LS.eGQL);
        return null;
    }

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
        return null;
    }

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
        return null;
    }

    if (photogrammetry.systemCreated) {
        if (!await createIdentifierForObject(null, captureDataDB)) {
            LOG.error(`ingestData unable to create identifier for photogrammetry data ${JSON.stringify(photogrammetry)}`, LOG.LS.eGQL);
            return null;
        }
    }

    if (photogrammetry.identifiers && photogrammetry.identifiers.length > 0) {
        for (const identifier of photogrammetry.identifiers) {
            if (!await createIdentifierForObject(identifier, captureDataDB)) {
                LOG.error(`ingestData unable to create identifier for photogrammetry data ${JSON.stringify(photogrammetry)}`, LOG.LS.eGQL);
                return null;
            }
        }
    }

    return captureDataDB;
}

async function createPhotogrammetryDerivedObjects(assetVersionMap: Map<number, DBAPI.SystemObjectBased>,
    ingestPhotoMap: Map<number, IngestPhotogrammetryInput>,
    ingestRes: Map<number, IngestAssetResult | null>): Promise<boolean> {
    // create CaptureDataFile
    let res: boolean = true;
    for (const [ idAssetVersion, SOBased ] of assetVersionMap) {
        if (!(SOBased instanceof DBAPI.CaptureData))
            continue;
        const ingestAssetRes: IngestAssetResult | null | undefined = ingestRes.get(idAssetVersion);
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

        const ingestPhotogrammetry: IngestPhotogrammetryInput | undefined = ingestPhotoMap.get(idAssetVersion);
        if (!ingestPhotogrammetry) {
            LOG.error(`ingestData unable to find photogrammetry input for idAssetVersion ${idAssetVersion}`, LOG.LS.eGQL);
            res = false;
            continue;
        }

        const folderVariantMap: Map<string, number> = new Map<string, number>(); // map of normalized folder name to variant vocabulary id
        for (const folder of ingestPhotogrammetry.folders) {
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

async function createModelObjects(model: IngestModelInput, assetVersionMap: Map<number, DBAPI.SystemObjectBased>): Promise<boolean> {
    const JCOutput: JobCookSIPackratInspectOutput | null = await JobCookSIPackratInspectOutput.extractFromAssetVersion(model.idAssetVersion);
    if (!JCOutput || !JCOutput.success || !JCOutput.modelConstellation || !JCOutput.modelConstellation.Model) {
        LOG.error(`ingestData createModelObjects failed to extract JobCookSIPackratInspectOutput from idAssetVersion ${model.idAssetVersion}`, LOG.LS.eGQL);
        return false;
    }

    const modelDB: DBAPI.Model = JCOutput.modelConstellation.Model;
    modelDB.Name = model.name;
    modelDB.DateCreated = H.Helpers.convertStringToDate(model.dateCaptured) || new Date();
    modelDB.Authoritative = model.authoritative;
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

    const res: H.IOResults = await JCOutput.persist(0, assetMap);
    if (!res.success) {
        LOG.error(`ingestData unable to create model constellation ${JSON.stringify(model)}: ${res.success}`, LOG.LS.eGQL);
        return false;
    }

    if (model.systemCreated) {
        if (!await createIdentifierForObject(null, modelDB)) {
            LOG.error(`ingestData unable to create identifier for model data ${JSON.stringify(model)}`, LOG.LS.eGQL);
            return false;
        }
    }

    if (model.identifiers && model.identifiers.length > 0) {
        for (const identifier of model.identifiers) {
            if (!await createIdentifierForObject(identifier, modelDB)) {
                LOG.error(`ingestData unable to create identifier for model data ${JSON.stringify(model)}`, LOG.LS.eGQL);
                return false;
            }
        }
    }

    // wire model to sourceObjects
    if (model.sourceObjects && model.sourceObjects.length > 0) {
        const SO: DBAPI.SystemObject | null = await modelDB.fetchSystemObject();
        if (SO) {
            for (const sourceObject of model.sourceObjects) {
                const xref: DBAPI.SystemObjectXref = new DBAPI.SystemObjectXref({
                    idSystemObjectMaster: sourceObject.idSystemObject,
                    idSystemObjectDerived: SO.idSystemObject,
                    idSystemObjectXref: 0
                });
                if (!await xref.create()) {
                    LOG.error(`ingestData failed to create SystemObjectXref ${JSON.stringify(xref)}`, LOG.LS.eGQL);
                    continue;
                }
            }
        } else
            LOG.error(`ingestData unable to fetch system object for model ${modelDB.idModel}`, LOG.LS.eGQL);
    }

    if (model.idAssetVersion)
        assetVersionMap.set(model.idAssetVersion, modelDB);
    return true;
}

async function wireItemToAssetOwners(itemDB: DBAPI.Item, assetVersionMap: Map<number, DBAPI.SystemObjectBased>): Promise<boolean> {
    for (const SOBased of assetVersionMap.values()) {
        const xref: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(itemDB, SOBased);
        if (!xref) {
            LOG.error(`ingestData unable to wire item ${JSON.stringify(itemDB)} to asset owner ${JSON.stringify(SOBased)}`, LOG.LS.eGQL);
            return false;
        }
    }
    return true;
}

async function promoteAssetsIntoRepository(assetVersionMap: Map<number, DBAPI.SystemObjectBased>, user: User): Promise<Map<number, IngestAssetResult | null>> {
    // map from idAssetVersion -> object that "owns" the asset
    const res: Map<number, IngestAssetResult | null> = new Map<number, IngestAssetResult | null>();
    for (const [idAssetVersion, SOBased] of assetVersionMap) {
        const assetVersionDB: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion);
        if (!assetVersionDB) {
            LOG.error(`ingestData unable to load assetVersion for ${idAssetVersion}`, LOG.LS.eGQL);
            res.set(idAssetVersion, null);
            continue;
        }

        const assetDB: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersionDB.idAsset);
        if (!assetDB) {
            LOG.error(`ingestData unable to load asset for ${assetVersionDB.idAsset}`, LOG.LS.eGQL);
            res.set(idAssetVersion, null);
            continue;
        }

        const opInfo: OperationInfo = {
            message: 'Ingesting asset',
            idUser: user.idUser,
            userEmailAddress: user.EmailAddress,
            userName: user.Name
        };
        const ISR: IngestAssetResult = await AssetStorageAdapter.ingestAsset(assetDB, assetVersionDB, SOBased, opInfo);
        if (!ISR.success)
            LOG.error(`ingestData unable to ingest assetVersion ${idAssetVersion}: ${ISR.error}`, LOG.LS.eGQL);
        res.set(idAssetVersion, ISR);
    }
    return res;
}
