import * as CACHE from '../../../../../cache';
import * as DBAPI from '../../../../../db';
import { eObjectGraphMode, eSystemObjectType } from '../../../../../db';
import { GetSystemObjectDetailsResult, QueryGetSystemObjectDetailsArgs, RepositoryPath } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as LOGGER from '../../../../../utils/logger';

export default async function getSystemObjectDetails(_: Parent, args: QueryGetSystemObjectDetailsArgs): Promise<GetSystemObjectDetailsResult> {
    const { input } = args;
    const { idSystemObject } = input;

    const oID: CACHE.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
    const objectAncestors: RepositoryPath[][] = await getRepositoryPathFromObjectGraph(idSystemObject);

    const systemObject = await DBAPI.SystemObject.fetch(idSystemObject);

    if (!oID) {
        const message: string = `No system object for ID: ${idSystemObject}`;
        LOGGER.logger.error(message);
        throw new Error(message);
    }

    if (!systemObject) {
        const message: string = `No system object for ID: ${idSystemObject}`;
        LOGGER.logger.error(message);
        throw new Error(message);
    }

    return {
        name: 'PhotoSet1.zip',
        retired: systemObject.Retired,
        objectType: oID.eObjectType,
        allowed: true,
        thumbnail: null,
        objectAncestors,
        identifiers: [
            {
                identifier: '31958de82-ab13-4049-c979-746e2fbe229e',
                identifierType: 75
            }
        ],
        sourceObjects: [
            {
                idSystemObject: 0,
                name: 'PhotoSetAlpha1.zip',
                identifier: 'a5cf8642-7466-4896-a0a2-d698f2009cd3',
                objectType: eSystemObjectType.eModel
            }
        ],
        derivedObjects: [
            {
                idSystemObject: 0,
                name: 'Photo1.zip',
                variantType: 28,
                objectType: eSystemObjectType.eAsset
            },
            {
                idSystemObject: 1,
                name: 'Photo2.zip',
                variantType: 28,
                objectType: eSystemObjectType.eAsset
            },
            {
                idSystemObject: 2,
                name: 'Photo3.zip',
                variantType: 28,
                objectType: eSystemObjectType.eAsset
            },
            {
                idSystemObject: 3,
                name: 'Photo4.zip',
                variantType: 28,
                objectType: eSystemObjectType.eAsset
            }
        ]
    };
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
