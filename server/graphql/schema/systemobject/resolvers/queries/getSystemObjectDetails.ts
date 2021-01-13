import * as CACHE from '../../../../../cache';
import * as DBAPI from '../../../../../db';
import { eObjectGraphMode, eSystemObjectType } from '../../../../../db';
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
import * as LOGGER from '../../../../../utils/logger';

export default async function getSystemObjectDetails(_: Parent, args: QueryGetSystemObjectDetailsArgs): Promise<GetSystemObjectDetailsResult> {
    const { input } = args;
    const { idSystemObject } = input;

    const oID: CACHE.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
    const { unit, project, subject, item, objectAncestors } = await getObjectAncestors(idSystemObject);

    const systemObject: SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
    const sourceObjects: RelatedObject[] = await getRelatedObjects(idSystemObject, RelatedObjectType.Source);
    const derivedObjects: RelatedObject[] = await getRelatedObjects(idSystemObject, RelatedObjectType.Derived);
    const publishedState: string = await getPublishedState(idSystemObject);
    const identifiers = await getIngestIdentifiers(idSystemObject);

    if (!oID) {
        const message: string = `No object ID found for ID: ${idSystemObject}`;
        LOGGER.logger.error(message);
        throw new Error(message);
    }

    if (!systemObject) {
        const message: string = `No system object found for ID: ${idSystemObject}`;
        LOGGER.logger.error(message);
        throw new Error(message);
    }

    const idObject: number = oID.idObject;
    const name: string = await resolveNameForObjectType(systemObject, oID.eObjectType);

    return {
        idObject,
        name,
        retired: systemObject.Retired,
        objectType: oID.eObjectType,
        allowed: true, // TODO: True until Access control is implemented (Post MVP)
        publishedState,
        thumbnail: null,
        unit,
        project,
        subject,
        item,
        objectAncestors,
        identifiers,
        sourceObjects,
        derivedObjects
    };
}

enum ePublishedState {
    eNotPublished = 'Not Published',
    eViewOnly = 'View Only',
    eViewDownloadRestriction = 'View and Download with usage restrictions',
    eViewDownloadCC0 = 'View and Download CC0'
}

// TODO: define system object version cache
async function getPublishedState(idSystemObject: number): Promise<ePublishedState> {
    const systemObjectVersions: DBAPI.SystemObjectVersion[] | null = await DBAPI.SystemObjectVersion.fetchFromSystemObject(idSystemObject);

    if (!systemObjectVersions || !systemObjectVersions?.length) return ePublishedState.eNotPublished;

    return ePublishedState.eViewOnly;
}

async function getRelatedObjects(idSystemObject: number, type: RelatedObjectType): Promise<RelatedObject[]> {
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
        const oID: CACHE.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(relatedSystemObject.idSystemObject);

        if (!oID) {
            const message: string = `No object ID found for ID: ${idSystemObject}`;
            LOGGER.logger.error(message);
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

    return identifier.map(({ IdentifierValue, idVIdentifierType }) => ({
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
    const objectGraph = new DBAPI.ObjectGraph(idSystemObject, eObjectGraphMode.eAncestors);
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
        const objectAncestor: RepositoryPath[] = await objectToRepositoryPath(objectGraph.unit, eSystemObjectType.eUnit);
        unit = objectAncestor[0];
        objectAncestors.push(objectAncestor);
    }

    if (objectGraph.project) {
        const objectAncestor: RepositoryPath[] = await objectToRepositoryPath(objectGraph.project, eSystemObjectType.eProject);
        project = objectAncestor[0];
        objectAncestors.push(objectAncestor);
    }

    if (objectGraph.subject) {
        const objectAncestor: RepositoryPath[] = await objectToRepositoryPath(objectGraph.subject, eSystemObjectType.eSubject);
        subject = objectAncestor[0];
        objectAncestors.push(objectAncestor);
    }

    if (objectGraph.item) {
        const objectAncestor: RepositoryPath[] = await objectToRepositoryPath(objectGraph.item, eSystemObjectType.eItem);
        item = objectAncestor[0];
        objectAncestors.push(objectAncestor);
    }

    if (objectGraph.captureData) objectAncestors.push(await objectToRepositoryPath(objectGraph.captureData, eSystemObjectType.eCaptureData));
    if (objectGraph.model) objectAncestors.push(await objectToRepositoryPath(objectGraph.model, eSystemObjectType.eModel));
    if (objectGraph.scene) objectAncestors.push(await objectToRepositoryPath(objectGraph.scene, eSystemObjectType.eScene));
    if (objectGraph.intermediaryFile) objectAncestors.push(await objectToRepositoryPath(objectGraph.intermediaryFile, eSystemObjectType.eIntermediaryFile));
    if (objectGraph.projectDocumentation) objectAncestors.push(await objectToRepositoryPath(objectGraph.projectDocumentation, eSystemObjectType.eProjectDocumentation));
    if (objectGraph.asset) objectAncestors.push(await objectToRepositoryPath(objectGraph.asset, eSystemObjectType.eAsset));
    if (objectGraph.assetVersion) objectAncestors.push(await objectToRepositoryPath(objectGraph.assetVersion, eSystemObjectType.eAssetVersion));
    if (objectGraph.actor) objectAncestors.push(await objectToRepositoryPath(objectGraph.actor, eSystemObjectType.eActor));
    if (objectGraph.stakeholder) objectAncestors.push(await objectToRepositoryPath(objectGraph.stakeholder, eSystemObjectType.eStakeholder));

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

async function objectToRepositoryPath(objects: Objects, objectType: eSystemObjectType): Promise<RepositoryPath[]> {
    const paths: RepositoryPath[] = [];
    for (const object of objects) {
        let SystemObject: SystemObject | null = null;

        if (object instanceof DBAPI.Unit && objectType === eSystemObjectType.eUnit) SystemObject = await DBAPI.SystemObject.fetchFromUnitID(object.idUnit);
        if (object instanceof DBAPI.Project && objectType === eSystemObjectType.eProject) SystemObject = await DBAPI.SystemObject.fetchFromProjectID(object.idProject);
        if (object instanceof DBAPI.Subject && objectType === eSystemObjectType.eSubject) SystemObject = await DBAPI.SystemObject.fetchFromSubjectID(object.idSubject);
        if (object instanceof DBAPI.Item && objectType === eSystemObjectType.eItem) SystemObject = await DBAPI.SystemObject.fetchFromItemID(object.idItem);
        if (object instanceof DBAPI.CaptureData && objectType === eSystemObjectType.eCaptureData)
            SystemObject = await DBAPI.SystemObject.fetchFromCaptureDataID(object.idCaptureData);
        if (object instanceof DBAPI.Model && objectType === eSystemObjectType.eModel) SystemObject = await DBAPI.SystemObject.fetchFromModelID(object.idModel);
        if (object instanceof DBAPI.Scene && objectType === eSystemObjectType.eScene) SystemObject = await DBAPI.SystemObject.fetchFromSceneID(object.idScene);
        if (object instanceof DBAPI.IntermediaryFile && objectType === eSystemObjectType.eIntermediaryFile)
            SystemObject = await DBAPI.SystemObject.fetchFromIntermediaryFileID(object.idIntermediaryFile);
        if (object instanceof DBAPI.ProjectDocumentation && objectType === eSystemObjectType.eProjectDocumentation)
            SystemObject = await DBAPI.SystemObject.fetchFromProjectDocumentationID(object.idProjectDocumentation);
        if (object instanceof DBAPI.Asset && objectType === eSystemObjectType.eAsset) SystemObject = await DBAPI.SystemObject.fetchFromAssetID(object.idAsset);
        if (object instanceof DBAPI.AssetVersion && objectType === eSystemObjectType.eAssetVersion)
            SystemObject = await DBAPI.SystemObject.fetchFromAssetVersionID(object.idAssetVersion);
        if (object instanceof DBAPI.Actor && objectType === eSystemObjectType.eActor) SystemObject = await DBAPI.SystemObject.fetchFromActorID(object.idActor);
        if (object instanceof DBAPI.Stakeholder && objectType === eSystemObjectType.eStakeholder)
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

async function resolveNameForObjectType(systemObject: SystemObject | null, objectType: eSystemObjectType): Promise<string> {
    if (!systemObject) return unknownName;

    switch (objectType) {
        case eSystemObjectType.eUnit:
            if (systemObject.idUnit) {
                const Unit = await DBAPI.Unit.fetch(systemObject.idUnit);
                if (Unit) {
                    return Unit.Name;
                }
            }

            return unknownName;

        case eSystemObjectType.eProject:
            if (systemObject.idProject) {
                const Project = await DBAPI.Project.fetch(systemObject.idProject);
                if (Project) {
                    return Project.Name;
                }
            }

            return unknownName;

        case eSystemObjectType.eSubject:
            if (systemObject.idSubject) {
                const Subject = await DBAPI.Subject.fetch(systemObject.idSubject);
                if (Subject) {
                    return Subject.Name;
                }
            }

            return unknownName;

        case eSystemObjectType.eItem:
            if (systemObject.idItem) {
                const Item = await DBAPI.Item.fetch(systemObject.idItem);
                if (Item) {
                    return Item.Name;
                }
            }

            return unknownName;

        case eSystemObjectType.eCaptureData:
            if (systemObject.idCaptureData) {
                const CaptureData = await DBAPI.CaptureData.fetch(systemObject.idCaptureData);
                if (CaptureData) {
                    const Vocabulary = await DBAPI.Vocabulary.fetch(CaptureData.idVCaptureMethod);
                    if (Vocabulary) {
                        return Vocabulary.Term;
                    }
                }
            }

            return unknownName;

        case eSystemObjectType.eModel:
            if (systemObject.idModel) {
                const ModelGeometryFile = await DBAPI.ModelGeometryFile.fetchFromModel(systemObject.idModel);
                if (ModelGeometryFile && ModelGeometryFile[0]) {
                    const Asset = await DBAPI.Asset.fetch(ModelGeometryFile[0].idAsset);
                    if (Asset) {
                        return Asset.FileName;
                    }
                }
            }
            return unknownName;

        case eSystemObjectType.eScene:
            if (systemObject.idScene) {
                const Scene = await DBAPI.Scene.fetch(systemObject.idScene);
                if (Scene) {
                    return Scene.Name;
                }
            }

            return unknownName;

        case eSystemObjectType.eIntermediaryFile:
            if (systemObject.idIntermediaryFile) {
                const IntermediaryFile = await DBAPI.IntermediaryFile.fetch(systemObject.idIntermediaryFile);
                if (IntermediaryFile) {
                    const Asset = await DBAPI.Asset.fetch(IntermediaryFile.idAsset);
                    if (Asset) {
                        return Asset.FileName;
                    }
                }
            }

            return unknownName;

        case eSystemObjectType.eProjectDocumentation:
            if (systemObject.idProjectDocumentation) {
                const ProjectDocumentation = await DBAPI.ProjectDocumentation.fetch(systemObject.idProjectDocumentation);
                if (ProjectDocumentation) {
                    return ProjectDocumentation.Name;
                }
            }

            return unknownName;

        case eSystemObjectType.eAsset:
            if (systemObject.idAsset) {
                const Asset = await DBAPI.Asset.fetch(systemObject.idAsset);
                if (Asset) {
                    return Asset.FileName;
                }
            }

            return unknownName;

        case eSystemObjectType.eAssetVersion:
            if (systemObject.idAssetVersion) {
                const AssetVersion = await DBAPI.AssetVersion.fetch(systemObject.idAssetVersion);
                if (AssetVersion) {
                    return AssetVersion.FileName;
                }
            }

            return unknownName;

        case eSystemObjectType.eActor:
            if (systemObject.idActor) {
                const Actor = await DBAPI.Actor.fetch(systemObject.idActor);
                if (Actor) {
                    return Actor?.IndividualName ?? unknownName;
                }
            }

            return unknownName;

        case eSystemObjectType.eStakeholder:
            if (systemObject.idStakeholder) {
                const Stakeholder = await DBAPI.Stakeholder.fetch(systemObject.idStakeholder);
                if (Stakeholder) {
                    return Stakeholder.IndividualName;
                }
            }

            return unknownName;

        default:
            return unknownName;
    }
}
