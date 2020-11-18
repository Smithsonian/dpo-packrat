import * as CACHE from '../../../../../cache';
import * as DBAPI from '../../../../../db';
import { eObjectGraphMode, eSystemObjectType } from '../../../../../db';
import {
    DerivedObject,
    GetSystemObjectDetailsResult,
    IngestIdentifier,
    QueryGetSystemObjectDetailsArgs,
    RepositoryPath,
    SourceObject,
    SystemObject
} from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as LOGGER from '../../../../../utils/logger';

export default async function getSystemObjectDetails(_: Parent, args: QueryGetSystemObjectDetailsArgs): Promise<GetSystemObjectDetailsResult> {
    const { input } = args;
    const { idSystemObject } = input;

    const oID: CACHE.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
    const objectAncestors: RepositoryPath[][] = await getRepositoryPathFromObjectGraph(idSystemObject);

    const systemObject: SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
    const sourceObjects: SourceObject[] = await getSourceObjects(idSystemObject);
    const derivedObjects: DerivedObject[] = await getDerivedObjects(idSystemObject);

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

    const name: string = await resolveNameForObjectType(systemObject, oID.eObjectType);

    return {
        name,
        retired: systemObject.Retired,
        objectType: oID.eObjectType,
        allowed: true, // TODO: KARAN: tell the client if user has access to edit
        thumbnail: null,
        objectAncestors,
        identifiers,
        sourceObjects,
        derivedObjects
    };
}

async function getSourceObjects(idSystemObject: number): Promise<SourceObject[]> {
    const masterObjects = await DBAPI.SystemObject.fetchMasterFromXref(idSystemObject);
    if (!masterObjects) return [];

    const sourceObjects: SourceObject[] = [];

    for (const masterObject of masterObjects) {
        const identifier: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromSystemObject(idSystemObject);
        const oID: CACHE.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(masterObject.idSystemObject);

        if (!oID) {
            const message: string = `No object ID found for ID: ${idSystemObject}`;
            LOGGER.logger.error(message);
            throw new Error(message);
        }

        const sourceObject: SourceObject = {
            idSystemObject: masterObject.idSystemObject,
            name: await resolveNameForObjectType(masterObject, oID.eObjectType),
            identifier: identifier?.[0]?.IdentifierValue ?? null,
            objectType: oID.eObjectType
        };

        sourceObjects.push(sourceObject);
    }

    return sourceObjects;
}

async function getDerivedObjects(idSystemObject: number): Promise<DerivedObject[]> {
    const derivedSystemObjects = await DBAPI.SystemObject.fetchDerivedFromXref(idSystemObject);
    if (!derivedSystemObjects) return [];

    const derivedObjects: DerivedObject[] = [];

    for (const derivedSystemObject of derivedSystemObjects) {
        const oID: CACHE.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(derivedSystemObject.idSystemObject);

        if (!oID) {
            const message: string = `No object ID found for ID: ${idSystemObject}`;
            LOGGER.logger.error(message);
            throw new Error(message);
        }

        const derivedObject: DerivedObject = {
            idSystemObject: derivedSystemObject.idSystemObject,
            name: await resolveNameForObjectType(derivedSystemObject, oID.eObjectType),
            variantType: 28, // TODO: KARAN: how to compute variant?
            objectType: oID.eObjectType
        };

        derivedObjects.push(derivedObject);
    }

    return derivedObjects;
}

async function getIngestIdentifiers(idSystemObject: number): Promise<IngestIdentifier[]> {
    const identifier: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromSystemObject(idSystemObject);

    if (!identifier) return [];

    return identifier.map(({ IdentifierValue, idVIdentifierType }) => ({
        identifier: IdentifierValue,
        identifierType: idVIdentifierType
    }));
}

async function getRepositoryPathFromObjectGraph(idSystemObject: number): Promise<RepositoryPath[][]> {
    const objectGraph = new DBAPI.ObjectGraph(idSystemObject, eObjectGraphMode.eAncestors);

    if (!(await objectGraph.fetch())) {
        return [];
    }

    const { unit, project, subject, item, captureData, model, scene, intermediaryFile, projectDocumentation, asset, assetVersion, actor, stakeholder } = objectGraph;
    const objectAncestors: RepositoryPath[][] = [];

    if (unit) objectAncestors.push(await unitsToRepositoryPath(unit));
    if (project) objectAncestors.push(await projectsToRepositoryPath(project));
    if (subject) objectAncestors.push(await subjectsToRepositoryPath(subject));
    if (item) objectAncestors.push(await itemsToRepositoryPath(item));
    if (captureData) objectAncestors.push(await captureDatasToRepositoryPath(captureData));
    if (model) objectAncestors.push(await modelsToRepositoryPath(model));
    if (scene) objectAncestors.push(await scenesToRepositoryPath(scene));
    if (intermediaryFile) objectAncestors.push(await intermediaryFilesToRepositoryPath(intermediaryFile));
    if (projectDocumentation) objectAncestors.push(await projectDocumentationsToRepositoryPath(projectDocumentation));
    if (asset) objectAncestors.push(await assetsToRepositoryPath(asset));
    if (assetVersion) objectAncestors.push(await assetVersionsToRepositoryPath(assetVersion));
    if (actor) objectAncestors.push(await actorsToRepositoryPath(actor));
    if (stakeholder) objectAncestors.push(await stakeholdersToRepositoryPath(stakeholder));

    return objectAncestors;
}

const defaultName: string = '<UNKNOWN>';

async function unitsToRepositoryPath(units: DBAPI.Unit[]): Promise<RepositoryPath[]> {
    const paths: RepositoryPath[] = [];
    for (const { idUnit, Abbreviation } of units) {
        const idSystemObject: number = (await DBAPI.SystemObject.fetchFromUnitID(idUnit))?.idSystemObject ?? 0;
        const path: RepositoryPath = {
            idSystemObject,
            name: Abbreviation || defaultName,
            objectType: eSystemObjectType.eUnit
        };
        paths.push(path);
    }

    return paths;
}

async function projectsToRepositoryPath(projects: DBAPI.Project[]): Promise<RepositoryPath[]> {
    const paths: RepositoryPath[] = [];
    for (const { idProject, Name } of projects) {
        const idSystemObject: number = (await DBAPI.SystemObject.fetchFromProjectID(idProject))?.idSystemObject ?? 0;
        const path: RepositoryPath = {
            idSystemObject,
            name: Name,
            objectType: eSystemObjectType.eProject
        };
        paths.push(path);
    }

    return paths;
}

async function subjectsToRepositoryPath(subjects: DBAPI.Subject[]): Promise<RepositoryPath[]> {
    const paths: RepositoryPath[] = [];
    for (const { idSubject, Name } of subjects) {
        const idSystemObject: number = (await DBAPI.SystemObject.fetchFromSubjectID(idSubject))?.idSystemObject ?? 0;
        const path: RepositoryPath = {
            idSystemObject,
            name: Name,
            objectType: eSystemObjectType.eSubject
        };
        paths.push(path);
    }

    return paths;
}

async function itemsToRepositoryPath(items: DBAPI.Item[]): Promise<RepositoryPath[]> {
    const paths: RepositoryPath[] = [];
    for (const { idItem, Name } of items) {
        const idSystemObject: number = (await DBAPI.SystemObject.fetchFromSubjectID(idItem))?.idSystemObject ?? 0;
        const path: RepositoryPath = {
            idSystemObject,
            name: Name,
            objectType: eSystemObjectType.eItem
        };
        paths.push(path);
    }

    return paths;
}

async function captureDatasToRepositoryPath(captureDatas: DBAPI.CaptureData[]): Promise<RepositoryPath[]> {
    const paths: RepositoryPath[] = [];
    for (const { idCaptureData } of captureDatas) {
        const idSystemObject: number = (await DBAPI.SystemObject.fetchFromCaptureDataID(idCaptureData))?.idSystemObject ?? 0;
        const path: RepositoryPath = {
            idSystemObject,
            name: 'CD', // TODO: KARAN: get name for CD
            objectType: eSystemObjectType.eCaptureData
        };
        paths.push(path);
    }

    return paths;
}

async function modelsToRepositoryPath(models: DBAPI.Model[]): Promise<RepositoryPath[]> {
    const paths: RepositoryPath[] = [];
    for (const { idModel } of models) {
        const idSystemObject: number = (await DBAPI.SystemObject.fetchFromModelID(idModel))?.idSystemObject ?? 0;
        const path: RepositoryPath = {
            idSystemObject,
            name: 'Model', // TODO: KARAN: get name for model
            objectType: eSystemObjectType.eModel
        };
        paths.push(path);
    }

    return paths;
}

async function scenesToRepositoryPath(scenes: DBAPI.Scene[]): Promise<RepositoryPath[]> {
    const paths: RepositoryPath[] = [];
    for (const { idScene, Name } of scenes) {
        const idSystemObject: number = (await DBAPI.SystemObject.fetchFromSceneID(idScene))?.idSystemObject ?? 0;
        const path: RepositoryPath = {
            idSystemObject,
            name: Name,
            objectType: eSystemObjectType.eScene
        };
        paths.push(path);
    }

    return paths;
}

async function intermediaryFilesToRepositoryPath(intermediaryFiles: DBAPI.IntermediaryFile[]): Promise<RepositoryPath[]> {
    const paths: RepositoryPath[] = [];
    for (const { idIntermediaryFile } of intermediaryFiles) {
        const idSystemObject: number = (await DBAPI.SystemObject.fetchFromIntermediaryFileID(idIntermediaryFile))?.idSystemObject ?? 0;
        const path: RepositoryPath = {
            idSystemObject,
            name: 'IF', // TODO: KARAN: get name for IF
            objectType: eSystemObjectType.eIntermediaryFile
        };
        paths.push(path);
    }

    return paths;
}

async function projectDocumentationsToRepositoryPath(projectDocumentations: DBAPI.ProjectDocumentation[]): Promise<RepositoryPath[]> {
    const paths: RepositoryPath[] = [];
    for (const { idProjectDocumentation, Name } of projectDocumentations) {
        const idSystemObject: number = (await DBAPI.SystemObject.fetchFromProjectDocumentationID(idProjectDocumentation))?.idSystemObject ?? 0;
        const path: RepositoryPath = {
            idSystemObject,
            name: Name,
            objectType: eSystemObjectType.eProjectDocumentation
        };
        paths.push(path);
    }

    return paths;
}

async function assetsToRepositoryPath(assets: DBAPI.Asset[]): Promise<RepositoryPath[]> {
    const paths: RepositoryPath[] = [];
    for (const { idAsset, FileName } of assets) {
        const idSystemObject: number = (await DBAPI.SystemObject.fetchFromAssetID(idAsset))?.idSystemObject ?? 0;
        const path: RepositoryPath = {
            idSystemObject,
            name: FileName,
            objectType: eSystemObjectType.eAsset
        };
        paths.push(path);
    }

    return paths;
}

async function assetVersionsToRepositoryPath(assetVersions: DBAPI.AssetVersion[]): Promise<RepositoryPath[]> {
    const paths: RepositoryPath[] = [];
    for (const { idAssetVersion, FileName } of assetVersions) {
        const idSystemObject: number = (await DBAPI.SystemObject.fetchFromAssetVersionID(idAssetVersion))?.idSystemObject ?? 0;
        const path: RepositoryPath = {
            idSystemObject,
            name: FileName,
            objectType: eSystemObjectType.eAssetVersion
        };
        paths.push(path);
    }

    return paths;
}

async function actorsToRepositoryPath(actors: DBAPI.Actor[]): Promise<RepositoryPath[]> {
    const paths: RepositoryPath[] = [];
    for (const { idActor } of actors) {
        const idSystemObject: number = (await DBAPI.SystemObject.fetchFromActorID(idActor))?.idSystemObject ?? 0;
        const path: RepositoryPath = {
            idSystemObject,
            name: 'Actor', // TODO: KARAN: get name for actor
            objectType: eSystemObjectType.eActor
        };
        paths.push(path);
    }

    return paths;
}

async function stakeholdersToRepositoryPath(stakeholders: DBAPI.Stakeholder[]): Promise<RepositoryPath[]> {
    const paths: RepositoryPath[] = [];
    for (const { idStakeholder, IndividualName } of stakeholders) {
        const idSystemObject: number = (await DBAPI.SystemObject.fetchFromStakeholderID(idStakeholder))?.idSystemObject ?? 0;
        const path: RepositoryPath = {
            idSystemObject,
            name: IndividualName,
            objectType: eSystemObjectType.eStakeholder
        };
        paths.push(path);
    }

    return paths;
}


async function resolveNameForObjectType(systemObject: SystemObject, objectType: eSystemObjectType): Promise<string> {
    const unknownName: string = '<UNKNOWN>';

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
            return unknownName;

        case eSystemObjectType.eModel:
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