import * as CACHE from '../../../../../cache';
import * as DBAPI from '../../../../../db';
import {
    GetSystemObjectDetailsResult,
    IngestIdentifier,
    QueryGetSystemObjectDetailsArgs,
    RelatedObject,
    RelatedObjectType,
    RepositoryPath,
    SystemObject
} from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as LOG from '../../../../../utils/logger';
import * as H from '../../../../../utils/helpers';

export default async function getSystemObjectDetails(_: Parent, args: QueryGetSystemObjectDetailsArgs): Promise<GetSystemObjectDetailsResult> {
    const { input } = args;
    const { idSystemObject } = input;
    LOG.info('getSystemObjectDetails 0', LOG.LS.eGQL);

    const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
    LOG.info('getSystemObjectDetails 1', LOG.LS.eGQL);

    const OGD: DBAPI.ObjectGraphDatabase = new DBAPI.ObjectGraphDatabase();
    const OG: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(idSystemObject, DBAPI.eObjectGraphMode.eAncestors, 32, OGD);
    const { unit, project, subject, item, objectAncestors } = await getObjectAncestors(OG);
    LOG.info('getSystemObjectDetails 2', LOG.LS.eGQL);

    const systemObject: SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
    const sourceObjects: RelatedObject[] = await getRelatedObjects(idSystemObject, RelatedObjectType.Source);
    LOG.info('getSystemObjectDetails 3', LOG.LS.eGQL);
    const derivedObjects: RelatedObject[] = await getRelatedObjects(idSystemObject, RelatedObjectType.Derived);
    LOG.info('getSystemObjectDetails 4', LOG.LS.eGQL);
    const objectVersions: DBAPI.SystemObjectVersion[] | null = await DBAPI.SystemObjectVersion.fetchFromSystemObject(idSystemObject);
    LOG.info('getSystemObjectDetails 5', LOG.LS.eGQL);
    const { publishedState, publishedEnum, publishable } = await getPublishedState(idSystemObject, oID);
    LOG.info('getSystemObjectDetails 6', LOG.LS.eGQL);
    const identifiers = await getIngestIdentifiers(idSystemObject);
    LOG.info('getSystemObjectDetails 7', LOG.LS.eGQL);

    if (!oID) {
        const message: string = `No object ID found for ID: ${idSystemObject}`;
        LOG.error(message, LOG.LS.eGQL);
        throw new Error(message);
    }

    if (!systemObject) {
        const message: string = `No system object found for ID: ${idSystemObject}`;
        LOG.error(`getSystemObjectDetails: ${message}`, LOG.LS.eGQL);
        throw new Error(message);
    }

    if (!objectVersions) {
        const message: string = `No SystemObjectVersions found for ID: ${idSystemObject}`;
        LOG.error(`getSystemObjectDetails: ${message}`, LOG.LS.eGQL);
        throw new Error(message);
    }

    const name: string = await resolveNameForObject(idSystemObject);
    LOG.info('getSystemObjectDetails 8', LOG.LS.eGQL);

    const LR: DBAPI.LicenseResolver | undefined = await CACHE.LicenseCache.getLicenseResolver(idSystemObject, OGD);
    LOG.info('getSystemObjectDetails 9', LOG.LS.eGQL);

    return {
        idSystemObject,
        idObject: oID.idObject,
        name,
        retired: systemObject.Retired,
        objectType: oID.eObjectType,
        allowed: true, // TODO: True until Access control is implemented (Post MVP)
        publishedState,
        publishedEnum,
        publishable,
        thumbnail: null,
        unit,
        project,
        subject,
        item,
        objectAncestors,
        identifiers,
        sourceObjects,
        derivedObjects,
        objectVersions,
        license: LR?.License,
        licenseInherited: LR?.inherited,
    };
}

async function getPublishedState(idSystemObject: number, oID: DBAPI.ObjectIDAndType | undefined): Promise<{ publishedState: string, publishedEnum: DBAPI.ePublishedState, publishable: boolean }> {
    const systemObjectVersion: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(idSystemObject);
    const publishedEnum: DBAPI.ePublishedState = systemObjectVersion ? systemObjectVersion.publishedStateEnum() : DBAPI.ePublishedState.eNotPublished;
    const publishedState: string = DBAPI.PublishedStateEnumToString(publishedEnum);
    let publishable: boolean = false;
    if (oID && oID.eObjectType == DBAPI.eSystemObjectType.eScene) {
        const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(oID.idObject);
        if (scene)
            publishable = scene.HasBeenQCd;
        else
            LOG.error(`Unable to compute scene for ${JSON.stringify(oID)}`, LOG.LS.eGQL);
    }
    return { publishedState, publishedEnum, publishable };
}

export async function getRelatedObjects(idSystemObject: number, type: RelatedObjectType): Promise<RelatedObject[]> {
    let relatedSystemObjects: SystemObject[] | null = [];

    if (type === RelatedObjectType.Source) {
        relatedSystemObjects = await DBAPI.SystemObject.fetchMasterFromXref(idSystemObject);
    } else if (type === RelatedObjectType.Derived) {
        relatedSystemObjects = await DBAPI.SystemObject.fetchDerivedFromXref(idSystemObject);
    }

    if (!relatedSystemObjects) return [];

    const relatedObjects: RelatedObject[] = [];

    for (const relatedSystemObject of relatedSystemObjects) {
        const identifier: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromSystemObject(relatedSystemObject.idSystemObject);
        const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(relatedSystemObject.idSystemObject);

        if (!oID) {
            const message: string = `No object ID found for ID: ${idSystemObject}`;
            LOG.error(message, LOG.LS.eGQL);
            throw new Error(message);
        }

        const sourceObject: RelatedObject = {
            idSystemObject: relatedSystemObject.idSystemObject,
            name: await resolveNameForObject(relatedSystemObject.idSystemObject),
            identifier: identifier?.[0]?.IdentifierValue ?? null,
            objectType: oID.eObjectType
        };

        relatedObjects.push(sourceObject);
    }

    return relatedObjects;
}

async function getIngestIdentifiers(idSystemObject: number): Promise<IngestIdentifier[]> {
    const identifier: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromSystemObject(idSystemObject);

    if (!identifier) return [];

    return identifier.map(({ idIdentifier, IdentifierValue, idVIdentifierType }) => ({
        idIdentifier,
        identifier: IdentifierValue,
        identifierType: idVIdentifierType
    }));
}

type GetObjectAncestorsResult = {
    unit: RepositoryPath | null;
    project: RepositoryPath | null;
    subject: RepositoryPath | null;
    item: RepositoryPath | null;
    objectAncestors: RepositoryPath[][];
};

async function getObjectAncestors(OG: DBAPI.ObjectGraph): Promise<GetObjectAncestorsResult> {
    let unit: RepositoryPath | null = null;
    let project: RepositoryPath | null = null;
    let subject: RepositoryPath | null = null;
    let item: RepositoryPath | null = null;

    if (!(await OG.fetch())) {
        return {
            unit,
            project,
            subject,
            item,
            objectAncestors: []
        };
    }
    LOG.info('getSystemObjectDetails 1a', LOG.LS.eGQL);

    const objectAncestors: RepositoryPath[][] = [];

    if (OG.unit) {
        const objectAncestor: RepositoryPath[] = await objectToRepositoryPath(OG.unit, DBAPI.eSystemObjectType.eUnit);
        unit = objectAncestor[0];
        objectAncestors.push(objectAncestor);
    }

    if (OG.project) {
        const objectAncestor: RepositoryPath[] = await objectToRepositoryPath(OG.project, DBAPI.eSystemObjectType.eProject);
        project = objectAncestor[0];
        objectAncestors.push(objectAncestor);
    }

    if (OG.subject) {
        const objectAncestor: RepositoryPath[] = await objectToRepositoryPath(OG.subject, DBAPI.eSystemObjectType.eSubject);
        subject = objectAncestor[0];
        objectAncestors.push(objectAncestor);
    }

    if (OG.item) {
        const objectAncestor: RepositoryPath[] = await objectToRepositoryPath(OG.item, DBAPI.eSystemObjectType.eItem);
        item = objectAncestor[0];
        objectAncestors.push(objectAncestor);
    }

    if (OG.captureData) objectAncestors.push(await objectToRepositoryPath(OG.captureData, DBAPI.eSystemObjectType.eCaptureData));
    if (OG.model) objectAncestors.push(await objectToRepositoryPath(OG.model, DBAPI.eSystemObjectType.eModel));
    if (OG.scene) objectAncestors.push(await objectToRepositoryPath(OG.scene, DBAPI.eSystemObjectType.eScene));
    if (OG.intermediaryFile) objectAncestors.push(await objectToRepositoryPath(OG.intermediaryFile, DBAPI.eSystemObjectType.eIntermediaryFile));
    if (OG.projectDocumentation) objectAncestors.push(await objectToRepositoryPath(OG.projectDocumentation, DBAPI.eSystemObjectType.eProjectDocumentation));
    if (OG.asset) objectAncestors.push(await objectToRepositoryPath(OG.asset, DBAPI.eSystemObjectType.eAsset));
    if (OG.assetVersion) objectAncestors.push(await objectToRepositoryPath(OG.assetVersion, DBAPI.eSystemObjectType.eAssetVersion));
    if (OG.actor) objectAncestors.push(await objectToRepositoryPath(OG.actor, DBAPI.eSystemObjectType.eActor));
    if (OG.stakeholder) objectAncestors.push(await objectToRepositoryPath(OG.stakeholder, DBAPI.eSystemObjectType.eStakeholder));

    LOG.info('getSystemObjectDetails 1b', LOG.LS.eGQL);
    return {
        unit,
        project,
        subject,
        item,
        objectAncestors
    };
}

const unknownName: string = '<UNKNOWN>';

type Objects =
    | DBAPI.Unit[]
    | DBAPI.Project[]
    | DBAPI.Subject[]
    | DBAPI.Item[]
    | DBAPI.CaptureData[]
    | DBAPI.Model[]
    | DBAPI.Scene[]
    | DBAPI.IntermediaryFile[]
    | DBAPI.ProjectDocumentation[]
    | DBAPI.Asset[]
    | DBAPI.AssetVersion[]
    | DBAPI.Actor[]
    | DBAPI.Stakeholder[];

async function objectToRepositoryPath(objects: Objects, objectType: DBAPI.eSystemObjectType): Promise<RepositoryPath[]> {
    const paths: RepositoryPath[] = [];
    for (const object of objects) {
        let idObject: number | null = null;

        if (object instanceof DBAPI.Unit)
            idObject = object.idUnit;
        else if (object instanceof DBAPI.Project)
            idObject = object.idProject;
        else if (object instanceof DBAPI.Subject)
            idObject = object.idSubject;
        else if (object instanceof DBAPI.Item)
            idObject = object.idItem;
        else if (object instanceof DBAPI.CaptureData)
            idObject = object.idCaptureData;
        else if (object instanceof DBAPI.Model)
            idObject = object.idModel;
        else if (object instanceof DBAPI.Scene)
            idObject = object.idScene;
        else if (object instanceof DBAPI.IntermediaryFile)
            idObject = object.idIntermediaryFile;
        else if (object instanceof DBAPI.ProjectDocumentation)
            idObject = object.idProjectDocumentation;
        else if (object instanceof DBAPI.Asset)
            idObject = object.idAsset;
        else if (object instanceof DBAPI.AssetVersion)
            idObject = object.idAssetVersion;
        else if (object instanceof DBAPI.Actor)
            idObject = object.idActor;
        else if (object instanceof DBAPI.Stakeholder)
            idObject = object.idStakeholder;
        else {
            LOG.error(`getSystemObjectDetails unable to determine type and id from ${JSON.stringify(object, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
            continue;
        }

        const oID: DBAPI.ObjectIDAndType | undefined = { idObject, eObjectType: objectType };
        const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
        if (SOI) {
            const path: RepositoryPath = {
                idSystemObject: SOI.idSystemObject,
                name: await resolveNameForObject(SOI.idSystemObject),
                objectType
            };
            paths.push(path);
        } else
            LOG.error(`getSystemObjectDetails could not compute system object info from ${JSON.stringify(oID)}`, LOG.LS.eGQL);
    }

    LOG.info(`getSystemObjectDetails 1b-${DBAPI.eSystemObjectType[objectType]} ${objects.length}`, LOG.LS.eGQL);
    return paths;
}

async function resolveNameForObject(idSystemObject: number): Promise<string> {
    const name: string | undefined = await CACHE.SystemObjectCache.getObjectNameByID(idSystemObject);
    return name || unknownName;
}
