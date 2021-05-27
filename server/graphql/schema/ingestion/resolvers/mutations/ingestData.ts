import {
    IngestDataInput, IngestDataResult, MutationIngestDataArgs,
    IngestSubjectInput, IngestItemInput, IngestIdentifierInput, User,
    IngestPhotogrammetryInput, IngestModelInput, IngestSceneInput, IngestOtherInput
} from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import * as COL from '../../../../../collections/interface';
import * as LOG from '../../../../../utils/logger';
import * as H from '../../../../../utils/helpers';
import { SvxReader, SvxExtraction } from '../../../../../utils/parser';
import * as WF from '../../../../../workflow/interface';
import { AssetStorageAdapter, IngestAssetResult, OperationInfo, ReadStreamResult } from '../../../../../storage/interface';
import { VocabularyCache, eVocabularyID } from '../../../../../cache';
import { JobCookSIPackratInspectOutput } from '../../../../../job/impl/Cook';

type AssetPair = {
    asset: DBAPI.Asset;
    assetVersion: DBAPI.AssetVersion | undefined;
};

export default async function ingestData(_: Parent, args: MutationIngestDataArgs, context: Context): Promise<IngestDataResult> {
    const { input } = args;
    const { user } = context;

    LOG.info(`ingestData: input=${JSON.stringify(input, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eGQL);
    const { success, ingestNew } = validateInput(user, input);
    if (!success)
        return { success: false, message: 'failure to validate input' };

    let itemDB: DBAPI.Item | null = null;
    if (ingestNew) {
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
                return { success: false, message: 'failure to retrieve or create subject' };
            subjectsDB.push(subjectDB);
        }

        // wire projects to subjects
        if (input.project.id && !(await wireProjectToSubjects(input.project.id, subjectsDB)))
            return { success: false, message: 'failure to wire project to subjects' };

        itemDB = await fetchOrCreateItem(input.item);
        if (!itemDB)
            return { success: false, message: 'failure to retrieve or create item' };

        // wire subjects to item
        if (!await wireSubjectsToItem(subjectsDB, itemDB))
            return { success: false, message: 'failure to wire subjects to item' };
    }

    const ingestPhotogrammetry: boolean = input.photogrammetry && input.photogrammetry.length > 0;
    const ingestModel: boolean = input.model && input.model.length > 0;
    const ingestScene: boolean = input.scene && input.scene.length > 0;
    const ingestOther: boolean = input.other && input.other.length > 0;
    const assetVersionMap: Map<number, DBAPI.SystemObjectBased> = new Map<number, DBAPI.SystemObjectBased>();       // map from idAssetVersion -> object that "owns" the asset -- populated during creation of asset-owning objects below
    const ingestPhotoMap: Map<number, IngestPhotogrammetryInput> = new Map<number, IngestPhotogrammetryInput>();    // map from idAssetVersion -> photogrammetry input

    if (ingestPhotogrammetry) {
        for (const photogrammetry of input.photogrammetry) {
            if (!await createPhotogrammetryObjects(photogrammetry, assetVersionMap, ingestPhotoMap))
                return { success: false, message: 'failure to create photogrammetry object' };
        }
    }

    if (ingestModel) {
        for (const model of input.model) {
            if (!await createModelObjects(model, assetVersionMap))
                return { success: false, message: 'failure to create model object' };
        }
    }

    if (ingestScene) {
        for (const scene of input.scene) {
            if (!await createSceneObjects(scene, assetVersionMap))
                return { success: false, message: 'failure to create scene object' };
        }
    }

    if (ingestOther) {
        for (const other of input.other) {
            if (!await createOtherObjects(other, assetVersionMap))
                return { success: false, message: 'failure to create other object' };
        }
    }

    // wire item to asset-owning objects
    if (itemDB) {
        if (!await wireItemToAssetOwners(itemDB, assetVersionMap))
            return { success: false, message: 'failure to wire item to asset owner' };
    }

    // next, promote asset into repository storage
    const ingestResMap: Map<number, IngestAssetResult | null> = await promoteAssetsIntoRepository(assetVersionMap, user!); // eslint-disable-line @typescript-eslint/no-non-null-assertion

    // use results to create/update derived objects
    if (ingestPhotogrammetry)
        await createPhotogrammetryDerivedObjects(assetVersionMap, ingestPhotoMap, ingestResMap);

    // notify workflow engine about this ingestion:
    if (!await sendWorkflowIngestionEvent(ingestResMap, user!)) // eslint-disable-line @typescript-eslint/no-non-null-assertion
        return { success: false, message: 'failure to notify workflow engine about ingestion event' };
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

async function handleIdentifiers(soBased: DBAPI.SystemObjectBased, systemCreated: boolean,
    identifiers: IngestIdentifierInput[] | undefined): Promise<boolean> {
    if (systemCreated) {
        if (!await createIdentifierForObject(null, soBased)) {
            LOG.error(`ingestData unable to create identifier for ${JSON.stringify(soBased)}`, LOG.LS.eGQL);
            return false;
        }
    }

    if (identifiers && identifiers.length > 0) {
        for (const identifier of identifiers) {
            if (!await createIdentifierForObject(identifier, soBased)) {
                LOG.error(`ingestData unable to create identifier for ${JSON.stringify(soBased)}`, LOG.LS.eGQL);
                return false;
            }
        }
    }
    return true;
}

async function createIdentifierForObject(identifier: IngestIdentifierInput | null, SOBased: DBAPI.SystemObjectBased): Promise<boolean> {
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

async function updateSubjectIdentifier(identifier: DBAPI.Identifier | null, subjectDB: DBAPI.Subject): Promise<boolean> {
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
    if (!await updateSubjectIdentifier(identifier, subjectDB))
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

async function createPhotogrammetryObjects(photogrammetry: IngestPhotogrammetryInput, assetVersionMap: Map<number, DBAPI.SystemObjectBased>,
    ingestPhotoMap: Map<number, IngestPhotogrammetryInput>): Promise<boolean> {
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

    if (!await handleIdentifiers(captureDataDB, photogrammetry.systemCreated, photogrammetry.identifiers))
        return false;

    if (photogrammetry.idAssetVersion) {
        assetVersionMap.set(photogrammetry.idAssetVersion, captureDataDB);
        ingestPhotoMap.set(photogrammetry.idAssetVersion, photogrammetry);
    }

    return true;
}

async function createPhotogrammetryDerivedObjects(assetVersionMap: Map<number, DBAPI.SystemObjectBased>,
    ingestPhotoMap: Map<number, IngestPhotogrammetryInput>,
    ingestResMap: Map<number, IngestAssetResult | null>): Promise<boolean> {
    // create CaptureDataFile
    let res: boolean = true;
    for (const [idAssetVersion, SOBased] of assetVersionMap) {
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

    // TODO: if we're updating an existing Model, we should update these records instead of creating new ones
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

    if (!await handleIdentifiers(modelDB, model.systemCreated, model.identifiers))
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

    if (model.idAssetVersion)
        assetVersionMap.set(model.idAssetVersion, modelDB);
    return true;
}

async function createSceneObjects(scene: IngestSceneInput, assetVersionMap: Map<number, DBAPI.SystemObjectBased>): Promise<boolean> {
    // TODO: if we're updating an existing Scehe, we should update these records instead of creating new ones
    const sceneConstellation: DBAPI.SceneConstellation | null = await DBAPI.SceneConstellation.fetchFromAssetVersion(scene.idAssetVersion);
    if (!sceneConstellation || !sceneConstellation.Scene)
        return false;

    const sceneDB: DBAPI.Scene = sceneConstellation.Scene;
    sceneDB.Name = scene.name;
    sceneDB.HasBeenQCd = scene.hasBeenQCd;
    sceneDB.IsOriented = scene.isOriented;
    let ret: boolean = await sceneDB.create();

    if (!await handleIdentifiers(sceneDB, scene.systemCreated, scene.identifiers))
        return false;

    // wire scene to reference models, including SystemObjectXref of 'scene as master' to 'models as derived'
    if (sceneConstellation.ModelSceneXref) {
        for (const MSX of sceneConstellation.ModelSceneXref) {
            if (MSX.idModelSceneXref || MSX.idScene) {
                LOG.error(`ingestData could not create ModelSceneXref for Scene ${sceneDB.idScene}, as record already was populated: ${JSON.stringify(MSX)}`, LOG.LS.eGQL);
                continue;
            }
            if (MSX.idModel <= 0) {
                LOG.error(`ingestData could not create ModelSceneXref for Scene ${sceneDB.idScene}, as model has not yet been ingested: ${JSON.stringify(MSX)}`, LOG.LS.eGQL);
                continue;
            }
            MSX.idScene = sceneDB.idScene;
            ret = await MSX.create() && ret;

            const modelDB: DBAPI.Model | null = await DBAPI.Model.fetch(MSX.idModel);
            if (!modelDB || !await DBAPI.SystemObjectXref.wireObjectsIfNeeded(sceneDB, modelDB)) {
                LOG.error(`ingestData could not create SystemObjectXref for Scene ${sceneDB.idScene} using: ${JSON.stringify(MSX)}`, LOG.LS.eGQL);
                ret = false;
                continue;
            }
        }
    }

    if (scene.idAssetVersion)
        assetVersionMap.set(scene.idAssetVersion, sceneDB);
    return true;
}

async function createOtherObjects(other: IngestOtherInput, assetVersionMap: Map<number, DBAPI.SystemObjectBased>): Promise<boolean> {
    // "other" means we're simply creating an asset version (and associated asset)
    // fetch the associated asset and use that for identifiers
    // BUT ... populate assetVersionMap with the system object that owns the specified asset ... or if none, the asset itself.

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

    if (!await handleIdentifiers(asset, other.systemCreated, other.identifiers))
        return false;

    if (other.idAssetVersion) {
        // if the asset is owned by a system object, use that system object as the owner of the new asset version
        let SOOwner: DBAPI.SystemObjectBased | null = null;
        if (asset.idSystemObject) {
            const SOP: DBAPI.SystemObjectPairs | null = await DBAPI.SystemObjectPairs.fetch(asset.idSystemObject);
            if (!SOP) {
                LOG.error(`ingestData could not fetch system object paids from ${JSON.stringify(asset, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eGQL);
                return false;
            }
            SOOwner = SOP.SystemObjectBased;
        }
        if (!SOOwner)
            SOOwner = asset;

        assetVersionMap.set(other.idAssetVersion, SOOwner);
    }
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
        // LOG.info(`ingestData.promoteAssetsIntoRepository ${idAssetVersion} -> ${JSON.stringify(SOBased)}`, LOG.LS.eGQL);
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
        else if (ISR.assets) {
            // Handle complex ingestion, such as ingestion of a scene package as a zip file.
            // In this case, we will receive the scene .svx.json file, supporting HTML, images, CSS, as well as models.
            // Each model asset needs a Model and ModelSceneXref, and the asset in question should be owned by the model.
            if (SOBased instanceof DBAPI.Scene)
                await handleComplexIngestionScene(SOBased, ISR);
        }
        res.set(idAssetVersion, ISR);
    }
    return res;
}

async function sendWorkflowIngestionEvent(ingestResMap: Map<number, IngestAssetResult | null>, user: User): Promise<boolean> {
    const workflowEngine: WF.IWorkflowEngine | null = await WF.WorkflowFactory.getInstance();
    if (!workflowEngine) {
        LOG.error('ingestData sendWorkflowIngestionEvent could not load WorkflowEngine', LOG.LS.eGQL);
        return false;
    }

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
            parameters: null
        };

        // send workflow engine event, but don't wait for results
        workflowEngine.event(CACHE.eVocabularyID.eWorkflowEventIngestionIngestObject, workflowParams);
    }

    return ret;
}

function validateInput(user: User | undefined, input: IngestDataInput): { success: boolean, ingestNew?: boolean } {
    const ingestPhotogrammetry: boolean = input.photogrammetry && input.photogrammetry.length > 0;
    const ingestModel: boolean = input.model && input.model.length > 0;
    const ingestScene: boolean = input.scene && input.scene.length > 0;
    const ingestOther: boolean = input.other && input.other.length > 0;
    let ingestNew: boolean = false;
    let ingestUpdate: boolean = false;

    if (ingestPhotogrammetry) {
        for (const photogrammetry of input.photogrammetry) {
            if (photogrammetry.idAsset)
                ingestUpdate = true;
            else
                ingestNew = true;
        }
    }

    if (ingestModel) {
        for (const model of input.model) {
            if (model.idAsset)
                ingestUpdate = true;
            else
                ingestNew = true;
        }
    }

    if (ingestScene) {
        for (const scene of input.scene) {
            if (scene.idAsset)
                ingestUpdate = true;
            else
                ingestNew = true;
        }
    }

    if (ingestOther) {
        for (const other of input.other) {
            if (other.idAsset)
                ingestUpdate = true;
            else
                ingestNew = true;
        }
    }

    // data validation; FYI ... input.project is allowed to be unspecified
    if (ingestNew && ingestUpdate) {
        LOG.error('ingestData called with an unsupported mix of additions and updates', LOG.LS.eGQL);
        return { success: false };
    }

    if (!ingestNew && !ingestUpdate) {
        LOG.error('ingestData called without both additions and updates', LOG.LS.eGQL);
        return { success: false };
    }

    if (ingestNew) {
        if (!input.subjects || input.subjects.length == 0) {
            LOG.error('ingestData called with no subjects', LOG.LS.eGQL);
            return { success: false };
        }

        if (!input.item) {
            LOG.error('ingestData called with no item', LOG.LS.eGQL);
            return { success: false };
        }
    }

    if (!user) {
        LOG.error('ingestData unable to retrieve user context', LOG.LS.eGQL);
        return { success: false };
    }
    return { success: true, ingestNew };
}

async function handleComplexIngestionScene(scene: DBAPI.Scene, ISR: IngestAssetResult): Promise<boolean> {
    if (!ISR.assets || !ISR.assetVersions)
        return false;

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
                    LOG.error(`ingestData handleComplexIngestionScene skipping unexpected scene ${JSON.stringify(asset, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eGQL);
                break;

            case eVocabularyID.eAssetAssetTypeModel:
            case eVocabularyID.eAssetAssetTypeModelGeometryFile: {
                const assetVersion: DBAPI.AssetVersion | undefined = assetVersionMap.get(asset.idAsset);
                modelAssetMap.set(asset.FileName.toLowerCase(), { asset, assetVersion });
            } break;
            case undefined:
                LOG.error(`ingestData handleComplexIngestionScene unable to detect asset type for ${JSON.stringify(asset, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eGQL);
                break;
        }
    }

    if (!sceneAsset || !sceneAssetVersion) {
        LOG.error(`ingestData handleComplexIngestionScene unable to identify asset and/or asset version for the ingested scene ${JSON.stringify(scene, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eGQL);
        return false;
    }

    // next, retrieve & parse the scene, extracting model references and transforms
    const RSR: ReadStreamResult = await AssetStorageAdapter.readAsset(sceneAsset, sceneAssetVersion);
    if (!RSR.success || !RSR.readStream) {
        LOG.error(`ingestData handleComplexIngestionScene unable to fetch stream for scene asset ${JSON.stringify(sceneAsset, H.Helpers.stringifyMapsAndBigints)}: ${RSR.error}`, LOG.LS.eGQL);
        return false;
    }

    const svx: SvxReader = new SvxReader();
    const res: H.IOResults = await svx.loadFromStream(RSR.readStream);
    if (!res.success || !svx.SvxExtraction) {
        LOG.error(`ingestData handleComplexIngestionScene unable to parse scene asset ${JSON.stringify(sceneAsset, H.Helpers.stringifyMapsAndBigints)}: ${res.error}`, LOG.LS.eGQL);
        return false;
    }

    extractSceneMetrics(scene, svx.SvxExtraction);
    if (!await scene.update())
        LOG.error(`ingestData handleComplexIngestionScene unable to update scene ${JSON.stringify(scene, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eGQL);

    // finally, create Model and ModelSceneXref for each model reference:
    let retValue: boolean = true;
    if (svx.SvxExtraction.modelDetails) {
        for (const MSX of svx.SvxExtraction.modelDetails) {
            if (!MSX.Name)
                continue;
            const assetPair: AssetPair | undefined = modelAssetMap.get(MSX.Name.toLowerCase());
            if (!assetPair || !assetPair.asset || !assetPair.assetVersion) {
                LOG.error(`ingestData handleComplexIngestionScene unable to locate assets for SVX model ${JSON.stringify(MSX)}`, LOG.LS.eGQL);
                retValue = false;
                continue;
            }

            const model: DBAPI.Model = await transformModelSceneXrefIntoModel(MSX);
            if (!await model.create()) {
                LOG.error(`ingestData handleComplexIngestionScene unable to create Model from referenced model ${JSON.stringify(MSX)}`, LOG.LS.eGQL);
                retValue = false;
                continue;
            }

            // Create ModelSceneXref for model and scene
            /* istanbul ignore else */
            if (!MSX.idModelSceneXref) { // should always be true
                MSX.idModel = model.idModel;
                MSX.idScene = scene.idScene;
                if (!await MSX.create()) {
                    LOG.error(`ingestData handleComplexIngestionScene unable to create ModelSceneXref for model xref ${JSON.stringify(MSX)}`, LOG.LS.eGQL);
                    retValue = false;
                    continue;
                }
            } else
                LOG.error(`ingestData handleComplexIngestionScene unexpected non-null ModelSceneXref for model xref ${JSON.stringify(MSX)}`, LOG.LS.eGQL);

            const SOX: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(scene, model);
            if (!SOX) {
                LOG.error(`ingestData handleComplexIngestionScene unable to wire Scene ${JSON.stringify(scene, H.Helpers.stringifyMapsAndBigints)} and Model ${JSON.stringify(model, H.Helpers.stringifyMapsAndBigints)} together`, LOG.LS.eGQL);
                retValue = false;
                continue;
            }

            // reassign asset to model; create SystemObjectVersion and SystemObjectVersionAssetVersionXref
            const SO: DBAPI.SystemObject | null = await model.fetchSystemObject();
            if (!SO) {
                LOG.error(`ingestData handleComplexIngestionScene unable to fetch SystemObject for Model ${JSON.stringify(model, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eGQL);
                retValue = false;
                continue;
            }
            assetPair.asset.idSystemObject = SO.idSystemObject;
            if (!await assetPair.asset.update()) {
                LOG.error(`ingestData handleComplexIngestionScene unable to reassign model asset ${JSON.stringify(assetPair.asset, H.Helpers.stringifyMapsAndBigints)} to Model ${JSON.stringify(model, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eGQL);
                retValue = false;
                continue;
            }

            const SOV: DBAPI.SystemObjectVersion = new DBAPI.SystemObjectVersion({
                idSystemObject: SO.idSystemObject,
                PublishedState: DBAPI.ePublishedState.eNotPublished,
                DateCreated: new Date(),
                idSystemObjectVersion: 0
            });
            if (!await SOV.create()) {
                LOG.error(`ingestData handleComplexIngestionScene unable to create SystemObjectVersion ${JSON.stringify(SOV, H.Helpers.stringifyMapsAndBigints)} for Model ${JSON.stringify(model, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eGQL);
                retValue = false;
                continue;
            }

            const SOVAVX: DBAPI.SystemObjectVersionAssetVersionXref = new DBAPI.SystemObjectVersionAssetVersionXref({
                idSystemObjectVersion: SOV.idSystemObjectVersion,
                idAssetVersion: assetPair.assetVersion.idAssetVersion,
                idSystemObjectVersionAssetVersionXref: 0,
            });
            if (!await SOVAVX.create()) {
                LOG.error(`ingestData handleComplexIngestionScene unable to create SystemObjectVersionAssetVersionXref ${JSON.stringify(SOVAVX, H.Helpers.stringifyMapsAndBigints)} for Model ${JSON.stringify(model, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eGQL);
                retValue = false;
                continue;
            }
        }
    }

    return retValue;
}

function extractSceneMetrics(scene: DBAPI.Scene, svxExtraction: SvxExtraction): void {
    const sceneExtract: DBAPI.Scene = svxExtraction.extractScene();
    scene.CountScene    = sceneExtract.CountScene;
    scene.CountNode     = sceneExtract.CountNode;
    scene.CountCamera   = sceneExtract.CountCamera;
    scene.CountLight    = sceneExtract.CountLight;
    scene.CountModel    = sceneExtract.CountModel;
    scene.CountMeta     = sceneExtract.CountMeta;
    scene.CountSetup    = sceneExtract.CountSetup;
    scene.CountTour     = sceneExtract.CountTour;
}

async function transformModelSceneXrefIntoModel(MSX: DBAPI.ModelSceneXref): Promise<DBAPI.Model> {
    const Name: string = MSX.Name ?? '';
    const vFileType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapModelFileByExtension(Name);
    const vPurpose: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eModelPurposeWebDelivery);
    return new DBAPI.Model({
        idModel: 0,
        Name,
        DateCreated: new Date(),
        Authoritative: false,
        idVCreationMethod: null,
        idVModality: null,
        idVPurpose: vPurpose ? vPurpose.idVocabulary : null,
        idVUnits: null,
        idVFileType: vFileType ? vFileType.idVocabulary : null,
        idAssetThumbnail: null, CountAnimations: null, CountCameras: null, CountFaces: null, CountLights: null,CountMaterials: null,
        CountMeshes: null, CountVertices: null, CountEmbeddedTextures: null, CountLinkedTextures: null, FileEncoding: null, IsDracoCompressed: null
    });
}