import { IngestDataResult, MutationIngestDataArgs, IngestSubjectInput, IngestItemInput, IngestPhotogrammetry, IngestIdentifier, User } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import * as COL from '../../../../../collections/interface';
import * as LOG from '../../../../../utils/logger';
import * as H from '../../../../../utils/helpers';
import { AssetStorageAdapter, IngestAssetResult, OperationInfo } from '../../../../../storage/interface';
import { VocabularyCache, eVocabularyID } from '../../../../../cache';

export default async function ingestData(_: Parent, args: MutationIngestDataArgs, context: Context): Promise<IngestDataResult> {
    const { input } = args;
    const { user } = context;

    // data validation; FYI ... input.project is allowed to be unspecified
    if (!input.subjects || input.subjects.length == 0) {
        LOG.logger.error('GraphQL ingestData called with no subjects');
        return { success: false };
    }

    if (!input.item) {
        LOG.logger.error('GraphQL ingestData called with no item');
        return { success: false };
    }

    if (!user) {
        LOG.logger.error('GraphQL ingestData unable to retrieve user context');
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

    // write subjects to item
    if (!await wireSubjectsToItem(subjectsDB, itemDB))
        return { success: false };

    // map from idAssetVersion -> object that "owns" the asset -- populated during creation of asset-owning objects below
    const assetVersionMap: Map<number, DBAPI.SystemObjectBased> = new Map<number, DBAPI.SystemObjectBased>();
    // create photogrammetry objects, if needed
    if (input.photogrammetry && input.photogrammetry.length > 0) {
        for (const photogrammetry of input.photogrammetry)
            if (!await createPhotogrammetryObjects(photogrammetry, assetVersionMap))
                return { success: false };
    }

    // wire item to asset-owning objects
    if (!await wireItemToAssetOwners(itemDB, assetVersionMap))
        return { success: false };

    // next, promote asset into repository storage
    if (!await promoteAssetsIntoRepository(assetVersionMap, user))
        return { success: false };

    return { success: true };
}

let vocabularyARK: DBAPI.Vocabulary | undefined = undefined;
async function getVocabularyARK(): Promise<DBAPI.Vocabulary | undefined> {
    if (!vocabularyARK) {
        vocabularyARK = await VocabularyCache.vocabularyByEnum(eVocabularyID.eIdentifierIdentifierTypeARK);
        if (!vocabularyARK) {
            LOG.logger.error('GraphQL ingestData unable to fetch vocabulary for ARK Identifiers');
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
        LOG.logger.error(`GraphQL ingestData unable to create identifier record for subject's arkId ${identifierValue}`);
        return null;
    }
    return identifier;
}

async function createIdentifierForObject(identifier: IngestIdentifier | null, SOBased: DBAPI.SystemObjectBased): Promise<boolean> {
    const SO: DBAPI.SystemObject | null = await SOBased.fetchSystemObject();
    if (!SO) {
        LOG.logger.error(`GraphQL ingestData unable to fetch system object from ${JSON.stringify(SOBased)}`);
        return false;
    }

    const ICOL: COL.ICollection = COL.CollectionFactory.getInstance();

    if (!identifier) {
        // create system identifier when needed
        const arkId: string = ICOL.generateArk(null, false);
        const identifierSystemDB: DBAPI.Identifier | null = await createIdentifier(arkId, SO, null);
        if (!identifierSystemDB) {
            LOG.logger.error(`GraphQL ingestData unable to create identifier record for object ${JSON.stringify(SOBased)}`);
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
                LOG.logger.error(`GraphQL ingestData asked to create an ark indentifier with invalid ark ${identifier.identifier} no value for ${JSON.stringify(SOBased)}`);
                return false;
            } else
                IdentifierValue = arkId;
        } else
            IdentifierValue = identifier.identifier;

        if (!IdentifierValue) {
            LOG.logger.error(`GraphQL ingestData asked to create an indentifier with no value for ${JSON.stringify(SOBased)}`);
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
            LOG.logger.error(`GraphQL ingestData unable to create unitEdan record for subject's unit ${Abbreviation}`);
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
        LOG.logger.error(`GraphQL ingestData unable to create subject record with name ${Name}`);
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
        LOG.logger.error(`GraphQL ingestData unable to fetch system object for subject record ${JSON.stringify(subjectDB)}`);
        return false;
    }
    identifier.idSystemObject = SO.idSystemObject;
    if (!await identifier.update()) {
        LOG.logger.error(`GraphQL ingestData unable to update identifier's idSystemObject ${JSON.stringify(identifier)}`);
        return false;
    }

    return true;
}

async function validateExistingSubject(subject: IngestSubjectInput, units: DBAPI.Unit[] | null): Promise<DBAPI.Subject | null> {
    // if this subject exists, validate it
    const subjectDB: DBAPI.Subject | null = subject.id ? await DBAPI.Subject.fetch(subject.id) : null;
    if (!subjectDB) {
        LOG.logger.error(`GraphQL ingestData called with invalid subject ${subject.id}`);
        return null;
    }

    // existing subjects must be connected to an existing unit
    if (!units || units.length == 0) {
        LOG.logger.error(`GraphQL ingestData called with invalid subject's unit ${subject.unit}`);
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
        LOG.logger.error(`GraphQL ingestData unable to fetch project ${idProject}`);
        return false;
    }

    for (const subjectDB of subjectsDB) {
        const xref: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(projectDB, subjectDB);
        if (!xref) {
            LOG.logger.error(`GraphQL ingestData unable to wire project ${JSON.stringify(projectDB)} to subject ${JSON.stringify(subjectDB)}`);
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
            LOG.logger.error(`GraphQL ingestData could not compute item from ${item.id}`);
    } else {
        itemDB = new DBAPI.Item({
            idAssetThumbnail: null,
            idGeoLocation: null,
            Name: item.name,
            EntireSubject: item.entireSubject,
            idItem: 0
        });

        if (!await itemDB.create()) {
            LOG.logger.error(`GraphQL ingestData unable to create item from ${JSON.stringify(item)}`);
            return null;
        }
    }

    return itemDB;
}

async function wireSubjectsToItem(subjectsDB: DBAPI.Subject[], itemDB: DBAPI.Item): Promise<boolean> {
    for (const subjectDB of subjectsDB) {
        const xref: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(subjectDB, itemDB);
        if (!xref) {
            LOG.logger.error(`GraphQL ingestData unable to wire subject ${JSON.stringify(subjectDB)} to item ${JSON.stringify(itemDB)}`);
            return false;
        }
    }
    return true;
}

// map from idAssetVersion -> object that "owns" the asset
async function createPhotogrammetryObjects(photogrammetry: IngestPhotogrammetry,
    assetVersionMap: Map<number, DBAPI.SystemObjectBased>): Promise<boolean> {

    const vocabulary: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eCaptureDataCaptureMethodPhotogrammetry);
    if (!vocabulary) {
        LOG.logger.error('GraphQL ingestData unable to retrieve photogrammetry capture method vocabulary from cache');
        return false;
    }


    // create photogrammetry objects, identifiers, etc.
    const captureDataDB: DBAPI.CaptureData = new DBAPI.CaptureData({
        idVCaptureMethod: vocabulary.idVocabulary,
        DateCaptured: H.Helpers.convertStringToDate(photogrammetry.dateCaptured) || new Date(),
        Description: photogrammetry.description,
        idAssetThumbnail: null,
        idCaptureData: 0
    });
    if (!await captureDataDB.create()) {
        LOG.logger.error(`GraphQL ingestData unable to create CaptureData for photogrammetry data ${JSON.stringify(photogrammetry)}`);
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
        LOG.logger.error(`GraphQL ingestData unable to create CaptureDataPhoto for photogrammetry data ${JSON.stringify(photogrammetry)}`);
        return false;
    }

    if (photogrammetry.systemCreated) {
        if (!await createIdentifierForObject(null, captureDataDB)) {
            LOG.logger.error(`GraphQL ingestData unable to create identifier for photogrammetry data ${JSON.stringify(photogrammetry)}`);
            return false;
        }
    }

    if (photogrammetry.identifiers && photogrammetry.identifiers.length > 0) {
        for (const identifier of photogrammetry.identifiers) {
            if (!await createIdentifierForObject(identifier, captureDataDB)) {
                LOG.logger.error(`GraphQL ingestData unable to create identifier for photogrammetry data ${JSON.stringify(photogrammetry)}`);
                return false;
            }
        }
    }

    // TODO: deal with zips and bulk ingest, in which we may want to split the uploaded asset into mutiple assets
    // TODO: create CaptureDataFile objects
    if (photogrammetry.idAssetVersion)
        assetVersionMap.set(photogrammetry.idAssetVersion, captureDataDB);
    return true;
}

async function wireItemToAssetOwners(itemDB: DBAPI.Item, assetVersionMap: Map<number, DBAPI.SystemObjectBased>): Promise<boolean> {
    for (const SOBased of assetVersionMap.values()) {
        const xref: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(itemDB, SOBased);
        if (!xref) {
            LOG.logger.error(`GraphQL ingestData unable to wire item ${JSON.stringify(itemDB)} to asset owner ${JSON.stringify(SOBased)}`);
            return false;
        }
    }
    return true;
}

async function promoteAssetsIntoRepository(assetVersionMap: Map<number, DBAPI.SystemObjectBased>, user: User): Promise<boolean> {
    // map from idAssetVersion -> object that "owns" the asset
    for (const [idAssetVersion, SOBased] of assetVersionMap) {
        const assetVersionDB: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion);
        if (!assetVersionDB) {
            LOG.logger.error(`GraphQL ingestData unable to load assetVersion for ${idAssetVersion}`);
            return false;
        }

        const assetDB: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersionDB.idAsset);
        if (!assetDB) {
            LOG.logger.error(`GraphQL ingestData unable to load asset for ${assetVersionDB.idAsset}`);
            return false;
        }

        const opInfo: OperationInfo = {
            message: 'Ingesting asset',
            idUser: user.idUser,
            userEmailAddress: user.EmailAddress,
            userName: user.Name
        };
        const ISR: IngestAssetResult = await AssetStorageAdapter.ingestAsset(assetDB, assetVersionDB, SOBased, opInfo);
        if (!ISR.success) {
            LOG.logger.error(`GraphQL ingestData unable to ingest assetVersion ${idAssetVersion}: ${ISR.error}`);
            return false;
        }
    }
    return true;
}
