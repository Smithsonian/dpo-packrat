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

export default async function getSystemObjectDetails(_: Parent, args: QueryGetSystemObjectDetailsArgs): Promise<GetSystemObjectDetailsResult> {
    const { input } = args;
    const { idSystemObject } = input;

    const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
    const { unit, project, subject, item, objectAncestors } = await getObjectAncestors(idSystemObject);

    const systemObject: SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
    const sourceObjects: RelatedObject[] = await getRelatedObjects(idSystemObject, RelatedObjectType.Source);
    const derivedObjects: RelatedObject[] = await getRelatedObjects(idSystemObject, RelatedObjectType.Derived);
    const objectVersions: DBAPI.SystemObjectVersion[] | null = await DBAPI.SystemObjectVersion.fetchFromSystemObject(idSystemObject);
    const { publishedState, publishedEnum, publishable } = await getPublishedState(idSystemObject, oID);
    const identifiers = await getIngestIdentifiers(idSystemObject);

    if (!oID) {
        const message: string = `No object ID found for ID: ${idSystemObject}`;
        LOG.error(message, LOG.LS.eGQL);
        throw new Error(message);
    }

    if (!systemObject) {
        const message: string = `No system object found for ID: ${idSystemObject}`;
        LOG.error(message, LOG.LS.eGQL);
        throw new Error(message);
    }

    if (!objectVersions) {
        const message: string = `No SystemObjectVersions found for ID: ${idSystemObject}`;
        LOG.error(message, LOG.LS.eGQL);
        throw new Error(message);
    }

    const idObject: number = oID.idObject;
    const name: string = await resolveNameForObjectType(systemObject, oID.eObjectType);

    const LR: DBAPI.LicenseResolver | undefined = await CACHE.LicenseCache.getLicenseResolver(idSystemObject);

    return {
        idSystemObject,
        idObject,
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
            name: await resolveNameForObjectType(relatedSystemObject, oID.eObjectType),
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

async function getObjectAncestors(idSystemObject: number): Promise<GetObjectAncestorsResult> {
    const objectGraph = new DBAPI.ObjectGraph(idSystemObject, DBAPI.eObjectGraphMode.eAncestors);
    let unit: RepositoryPath | null = null;
    let project: RepositoryPath | null = null;
    let subject: RepositoryPath | null = null;
    let item: RepositoryPath | null = null;

    if (!(await objectGraph.fetch())) {
        return {
            unit,
            project,
            subject,
            item,
            objectAncestors: []
        };
    }

    const objectAncestors: RepositoryPath[][] = [];

    if (objectGraph.unit) {
        const objectAncestor: RepositoryPath[] = await objectToRepositoryPath(objectGraph.unit, DBAPI.eSystemObjectType.eUnit);
        unit = objectAncestor[0];
        objectAncestors.push(objectAncestor);
    }

    if (objectGraph.project) {
        const objectAncestor: RepositoryPath[] = await objectToRepositoryPath(objectGraph.project, DBAPI.eSystemObjectType.eProject);
        project = objectAncestor[0];
        objectAncestors.push(objectAncestor);
    }

    if (objectGraph.subject) {
        const objectAncestor: RepositoryPath[] = await objectToRepositoryPath(objectGraph.subject, DBAPI.eSystemObjectType.eSubject);
        subject = objectAncestor[0];
        objectAncestors.push(objectAncestor);
    }

    if (objectGraph.item) {
        const objectAncestor: RepositoryPath[] = await objectToRepositoryPath(objectGraph.item, DBAPI.eSystemObjectType.eItem);
        item = objectAncestor[0];
        objectAncestors.push(objectAncestor);
    }

    if (objectGraph.captureData) objectAncestors.push(await objectToRepositoryPath(objectGraph.captureData, DBAPI.eSystemObjectType.eCaptureData));
    if (objectGraph.model) objectAncestors.push(await objectToRepositoryPath(objectGraph.model, DBAPI.eSystemObjectType.eModel));
    if (objectGraph.scene) objectAncestors.push(await objectToRepositoryPath(objectGraph.scene, DBAPI.eSystemObjectType.eScene));
    if (objectGraph.intermediaryFile) objectAncestors.push(await objectToRepositoryPath(objectGraph.intermediaryFile, DBAPI.eSystemObjectType.eIntermediaryFile));
    if (objectGraph.projectDocumentation) objectAncestors.push(await objectToRepositoryPath(objectGraph.projectDocumentation, DBAPI.eSystemObjectType.eProjectDocumentation));
    if (objectGraph.asset) objectAncestors.push(await objectToRepositoryPath(objectGraph.asset, DBAPI.eSystemObjectType.eAsset));
    if (objectGraph.assetVersion) objectAncestors.push(await objectToRepositoryPath(objectGraph.assetVersion, DBAPI.eSystemObjectType.eAssetVersion));
    if (objectGraph.actor) objectAncestors.push(await objectToRepositoryPath(objectGraph.actor, DBAPI.eSystemObjectType.eActor));
    if (objectGraph.stakeholder) objectAncestors.push(await objectToRepositoryPath(objectGraph.stakeholder, DBAPI.eSystemObjectType.eStakeholder));

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
        let SystemObject: SystemObject | null = null;

        if (object instanceof DBAPI.Unit && objectType === DBAPI.eSystemObjectType.eUnit)
            SystemObject = await DBAPI.SystemObject.fetchFromUnitID(object.idUnit);
        if (object instanceof DBAPI.Project && objectType === DBAPI.eSystemObjectType.eProject)
            SystemObject = await DBAPI.SystemObject.fetchFromProjectID(object.idProject);
        if (object instanceof DBAPI.Subject && objectType === DBAPI.eSystemObjectType.eSubject)
            SystemObject = await DBAPI.SystemObject.fetchFromSubjectID(object.idSubject);
        if (object instanceof DBAPI.Item && objectType === DBAPI.eSystemObjectType.eItem)
            SystemObject = await DBAPI.SystemObject.fetchFromItemID(object.idItem);
        if (object instanceof DBAPI.CaptureData && objectType === DBAPI.eSystemObjectType.eCaptureData)
            SystemObject = await DBAPI.SystemObject.fetchFromCaptureDataID(object.idCaptureData);
        if (object instanceof DBAPI.Model && objectType === DBAPI.eSystemObjectType.eModel)
            SystemObject = await DBAPI.SystemObject.fetchFromModelID(object.idModel);
        if (object instanceof DBAPI.Scene && objectType === DBAPI.eSystemObjectType.eScene)
            SystemObject = await DBAPI.SystemObject.fetchFromSceneID(object.idScene);
        if (object instanceof DBAPI.IntermediaryFile && objectType === DBAPI.eSystemObjectType.eIntermediaryFile)
            SystemObject = await DBAPI.SystemObject.fetchFromIntermediaryFileID(object.idIntermediaryFile);
        if (object instanceof DBAPI.ProjectDocumentation && objectType === DBAPI.eSystemObjectType.eProjectDocumentation)
            SystemObject = await DBAPI.SystemObject.fetchFromProjectDocumentationID(object.idProjectDocumentation);
        if (object instanceof DBAPI.Asset && objectType === DBAPI.eSystemObjectType.eAsset)
            SystemObject = await DBAPI.SystemObject.fetchFromAssetID(object.idAsset);
        if (object instanceof DBAPI.AssetVersion && objectType === DBAPI.eSystemObjectType.eAssetVersion)
            SystemObject = await DBAPI.SystemObject.fetchFromAssetVersionID(object.idAssetVersion);
        if (object instanceof DBAPI.Actor && objectType === DBAPI.eSystemObjectType.eActor)
            SystemObject = await DBAPI.SystemObject.fetchFromActorID(object.idActor);
        if (object instanceof DBAPI.Stakeholder && objectType === DBAPI.eSystemObjectType.eStakeholder)
            SystemObject = await DBAPI.SystemObject.fetchFromStakeholderID(object.idStakeholder);

        const path: RepositoryPath = {
            idSystemObject: SystemObject?.idSystemObject ?? 0,
            name: await resolveNameForObjectType(SystemObject, objectType),
            objectType
        };
        paths.push(path);
    }

    return paths;
}

async function resolveNameForObjectType(systemObject: SystemObject | null, _objectType: DBAPI.eDBObjectType): Promise<string> {
    if (!systemObject)
        return unknownName;
    const name: string | undefined = await CACHE.SystemObjectCache.getObjectNameByID(systemObject.idSystemObject);
    return name || unknownName;
}
