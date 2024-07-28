/* eslint-disable @typescript-eslint/no-explicit-any */
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import * as COMMON from '../../../../common';
import { ASL, LocalStore } from '../../../utils/localStore';
import { PublishScene } from '../../../collections/impl/PublishScene';
// import { eEventKey } from '../../../event/interface/EventEnums';
// import { AuditFactory } from '../../../audit/interface/AuditFactory';
import { isAuthenticated } from '../../auth';
import { Request, Response } from 'express';

//#region Project List
type ProjectResponse = {
    success: boolean,           // was the request successful
    message?: string,           // errors from the request|workflow to put in console or display to user
    // dataType?: DataType,        // what to expect in 'data'
    data? //ummarySubject | SummaryMediaGroup | SummaryScene
};
const generateResponse = (success: boolean, message?: string | undefined, data?): ProjectResponse => {
    return {
        success,
        message,
        data
    };
};
const isAuthorized = async (req: Request): Promise<H.IOResults> => {

    // make sure we're authenticated (i.e. see if request has a 'user' object)
    if (!isAuthenticated(req)) {
        LOG.error('API.getSummary failed. not authenticated.', LOG.LS.eHTTP);
        return { success: false, error: 'not authenticated' };
    }

    // get our LocalStore. If we don't have one then bail. it is needed for the user id, auditing, and workflows
    const LS: LocalStore | undefined = ASL.getStore();
    if(!LS || !LS.idUser){
        LOG.error('API.getSummary failed. cannot get LocalStore or idUser',LOG.LS.eHTTP);
        return { success: false, error: `missing local store/user (${LS?.idUser})` };
    }

    // make sure we're of specific class of user (e.g. admin)
    const authorizedUsers: number[] = [
        2,  // Jon Blundell
        4,  // Jamie Cope
        5   // Eric Maslowski
    ];
    if(!authorizedUsers.includes(LS.idUser)) {
        LOG.error(`API.getProjects failed. user is not authorized for this request (${LS.idUser})`,LOG.LS.eHTTP);
        return { success: false, error: `user (${LS.idUser}) does not have permission.` };
    }

    return { success: true };
};
const getElapseSeconds = (startTime: number, endTime: number): number => {
    return (endTime - startTime)/1000;
};
export async function getProjects(req: Request, res: Response): Promise<void> {
    // LOG.info('Generating Downloads from API request...', LOG.LS.eHTTP);

    // make sure we're authorized to run this routine
    const authResult = await isAuthorized(req);
    if(authResult.success===false) {
        res.status(200).send(JSON.stringify(generateResponse(false,`getProjects: ${authResult.error}`)));
        return;
    }

    // get our list of projects from the DB
    const projects: DBAPI.Project[] | null = await DBAPI.Project.fetchAll();
    if(!projects || projects.length===0) {
        const error = `no projects found ${!projects ? '(is NULL)':''}`;
        LOG.error(`API.getProject failed. ${error}`, LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(false,`getProjects: ${error}`)));
        return;
    }

    // return success
    res.status(200).send(JSON.stringify(generateResponse(true,`Returned ${projects.length} projects`,[...projects])));
}
//#endregion

//#region Project Scenes
export async function getProjectScenes(req: Request, res: Response): Promise<void> {
    // TODO: optimize with one or more crafted SQL statements returning exactly what's needed
    //       instead of iterating over scenes with many DB requests.

    // make sure we're authorized to run this routine
    const authResult = await isAuthorized(req);
    if(authResult.success===false) {
        res.status(200).send(JSON.stringify(generateResponse(false,`getProjectScenes: ${authResult.error}`)));
        return;
    }

    // get our project id from our params
    const { id } = req.params;
    const idProject: number = parseInt(id);
    console.log(`>>> get project scenes: ${idProject}`);

    // our holder for final scenes
    let project: DBAPI.Project | null = null;
    let scenes: DBAPI.Scene[] | null = null;
    let timestamp: number = Date.now();

    // either get all scenes (id < 0) or those for a project
    if(idProject < 0) {
        scenes = await DBAPI.Scene.fetchAll();
    } else {
        // get our project
        project = await DBAPI.Project.fetch(idProject);
        if(!project) {
            const error = `cannot find Project (${idProject})`;
            LOG.error(`API.getProjectScenes ${error}`,LOG.LS.eDB);
            res.status(200).send(JSON.stringify(generateResponse(false,error)));
            return;
        }

        // get our scenes for the project
        scenes = await DBAPI.Scene.fetchByProjectID(project.idProject);
    }

    // make sure we have scenes
    if(!scenes) {
        const error = `cannot get scenes from Project in DB (${idProject})`;
        LOG.error(`API.getProjectScenes ${error}`,LOG.LS.eDB);
        res.status(200).send(JSON.stringify(generateResponse(false,error)));
        return;
    } else if(scenes.length===0) {
        res.status(200).send(JSON.stringify(generateResponse(true,'Returned 0 scenes',[])));
        return;
    }

    // initial scene gathering status output
    LOG.info(`API.getProjectScenes grabbed ${scenes.length} scenes from Project (${(idProject<0)?'all':idProject}) in ${getElapseSeconds(timestamp,Date.now())} seconds`,LOG.LS.eDEBUG);
    timestamp = Date.now();

    // cycle through scenes building results, and removing any that are null
    const buildScenePromises = scenes.map(scene => buildProjectSceneDef(scene, project));
    const builtScenes = await Promise.all(buildScenePromises);
    const result: SceneSummary[] = builtScenes.filter((scene): scene is SceneSummary => scene !== null);

    // initial scene gathering status output
    LOG.info(`API.getProjectScenes processed ${result.length}/${scenes.length} scenes from Project (${(idProject<0)?'all':idProject}) in ${getElapseSeconds(timestamp,Date.now())} seconds`,LOG.LS.eDEBUG);

    // return success
    console.log(`data size: ${JSON.stringify(scenes).length} bytes`);
    res.status(200).send(JSON.stringify(generateResponse(true,`Returned ${result.length} scenes`,[...result])));
}

// NOTE: 'Summary' types/objects are intended for return via the API and for external use
//       so non-standard types (e.g. enums) are converted to strings for clarity/accessibility.
type DBReference = {
    id: number,     // system object id
    name: string,   // name of object
};
type AssetSummary = DBReference & {
    downloadable: boolean,
    quality: string,
    usage: string,
    dateCreated: Date,
};
type AssetList = {
    status: string,
    items: AssetSummary[];
};
type SceneSummary = DBReference & {
    project: DBReference,
    subject: DBReference,
    mediaGroup: DBReference,
    dateCreated: Date,
    downloads: AssetList,
    publishedState: string,
    datePublished: Date,
    isReviewed: boolean
};
const buildProjectSceneDef = async (scene: DBAPI.Scene, project: DBAPI.Project | null): Promise<SceneSummary | null> => {

    // get published state and properties (SystemObjectVersion)
    const sceneSO: DBAPI.SystemObject | null = await scene.fetchSystemObject();
    if(!sceneSO) {
        LOG.error(`API.Project.buildProjectSceneDef failed to get scene (${scene.idScene}) SystemObject`,LOG.LS.eDB);
        return null;
    }
    const sceneSOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(sceneSO.idSystemObject);
    if(!sceneSOV) {
        LOG.error(`API.Project.buildProjectSceneDef failed to get SystemObjectVersion (${sceneSO.idSystemObject}) for scene (idScene: ${scene.idScene})`,LOG.LS.eDB);
        return null;
    }

    // get our item
    const itemResults: DBAPI.Item[] | null = await DBAPI.Item.fetchMasterFromScenes([scene.idScene]);
    if(!itemResults || itemResults.length===0) {
        LOG.error(`API.Project.buildProjectSceneDef failed to get Item (${scene.idScene})`,LOG.LS.eDB);
        return null;
    } else if(itemResults.length > 1) {
        LOG.error(`API.Project.buildProjectSceneDef scene (idScene: ${scene.idScene}) has more than one Media Group (idItem: ${itemResults.map((i)=>i.idItem).join(',')})`,LOG.LS.eDB);
    }
    const item: DBAPI.Item = itemResults[0];
    const itemSO: DBAPI.SystemObject | null = await item.fetchSystemObject();

    // get our Subject
    const subjectResults: DBAPI.Subject[] | null = await DBAPI.Subject.fetchMasterFromItems([item.idItem]);
    let subjectAltName: string | null = null;
    if(!subjectResults || subjectResults.length===0) {
        LOG.error(`API.Project.buildProjectSceneDef failed to get Subject (${scene.idScene})`,LOG.LS.eDB);
        return null;
    } else if(subjectResults.length > 1) {
        // if we have more than one subject assigned (error) then we concat the names so it's clear
        // on the front end too.
        LOG.error(`API.Project.buildProjectSceneDef MediaGroup (idItem: ${item.idItem}) of scene (idScene: ${scene.idScene}) has more than one Subject (idSubject: ${subjectResults.map((i)=>i.idSubject).join(',')})`,LOG.LS.eDB);
        subjectAltName = '(X) '+subjectResults.map((s) => s.Name).join(' | ');
    }
    const subject: DBAPI.Subject = subjectResults[0];
    if(subjectAltName)
        subject.Name = subjectAltName;
    const subjectSO: DBAPI.SystemObject | null = await subject.fetchSystemObject();

    // get our Project if one doesn't already exist
    if(!project) {
        const projResults: DBAPI.Project[] | null = await DBAPI.Project.fetchFromScene(scene.idScene);
        if(projResults && projResults.length>0)
            project = projResults[0];
    }
    const projectSO: DBAPI.SystemObject | null = await project?.fetchSystemObject() ?? null;

    // get downloads for scene and determine if available
    const downloadMSXMap: Map<number, DBAPI.ModelSceneXref> | null = await PublishScene.computeDownloadMSXMap(scene.idScene);
    if(!downloadMSXMap) {
        LOG.error(`API.Project.buildProjectSceneDef failed to get downloads map (${scene.idScene})`,LOG.LS.eDB);
        return null;
    }

    // build list of downloads (filename, usage/flags)
    const downloadSummaries: AssetSummary[] | null = [];
    for(const [key, value] of downloadMSXMap) {
        const download: AssetSummary | null = await buildAssetSummaryFromMSX(key,value);
        if(download)
            downloadSummaries.push(download);
    }

    // build our data structure to return
    const result: SceneSummary = {
        id: sceneSO.idSystemObject,
        name: scene.Name,
        project: (project)
            ? { id: projectSO?.idSystemObject ?? -1, name: project.Name }
            : { id: -1, name: 'NA' },
        subject:
            { id: subjectSO?.idSystemObject ?? -1, name: subject.Name },
        mediaGroup:
            { id: itemSO?.idSystemObject ?? -1, name: getItemName(item) },
        dateCreated: sceneSOV.DateCreated,
        downloads: { status: getDownloadStatus(downloadSummaries), items: downloadSummaries },
        publishedState: resolvePublishedState(sceneSOV.PublishedState),
        datePublished: new Date(0), // does it exist? store epoch to signal error
        isReviewed: scene.PosedAndQCd as boolean
    };

    return result;
};

const buildAssetSummaryFromMSX = async (id: number,msx: DBAPI.ModelSceneXref): Promise<AssetSummary | null> => {

    const { usage, quality } = getDownloadProperties(msx.Usage,msx.Quality);

    // get our actual model so we can get the date created
    const model: DBAPI.Model | null = await DBAPI.Model.fetch(msx.idModel);

    // build our structure and return
    const result: AssetSummary = {
        id,
        name: msx.Name ?? 'NA',
        quality,
        usage,
        downloadable: isDownloadable(msx.Name),
        dateCreated: (model) ? model.DateCreated : new Date(0), // if erro store epoch as date
    };
    return result;
};
const isDownloadable = (filename: string | null): boolean => {
    if(!filename)
        return false;

    const downloadSuffixes: string[] = [
        '4096_std.glb',                 // webAssetGlbLowUncompressed
        '4096-gltf_std.zip',            // gltfZipLow
        '2048_std_draco.glb',           // AR: App3D
        '2048_std.usdz',                // AR: iOSApp3D
        'full_resolution-obj_std.zip',  // objZipFull
        '4096-obj_std.zip'              // objZipLow
    ];

    for(let i=0; i<downloadSuffixes.length; i++) {
        if(filename.includes(downloadSuffixes[i])===true) {
            return true;
        }
    }
    return false;
};
const getDownloadStatus = (downloads: AssetSummary[]): string => {

    // if we have less than 6 downloads we're missing some
    if(downloads.length<6)
        return 'Missing';

    // check the dates to see if any are before a fix in Cook on June 14th, 2024
    // which better handled material properties during inspection.
    const targetDate: Date = new Date('2024-06-14T00:00:00Z');
    for(let i=0; i<downloads.length; i++) {
        if(downloads[i].dateCreated < targetDate)
            return 'Error';
    }
    return 'Good';
};
const getDownloadProperties = (usage: string | null, quality: string | null) => {

    const voyagerUsageTypes: string[] = [
        'webAssetGlbLowUncompressed',
        'App3D',
        'iOSApp3D',
        'objZipFull',
        'gltfZipLow',
        'objZipLow'
    ];

    // cycle through suffixes to determine usage type/purpose
    // types: Web, Native, AR, Printing, Undefined
    let assetUsage: string = 'Undefined';
    if(usage) {
        for(let i=0; i<voyagerUsageTypes.length; i++) {
            const usageType: string = voyagerUsageTypes[i];
            if(usage.includes(usageType)) {
                switch(usageType) {
                    case 'webAssetGlbLowUncompressed':   // webAssetGlbLowUncompressed
                    case 'gltfZipLow':                  // gltfZipLow
                        { assetUsage = 'Web'; } break;

                    case 'objZipFull':                  // objZipFull
                    case 'objZipLow':                   // objZipLow
                        { assetUsage = 'Native'; } break;

                    case 'App3D':                       // AR: App3D
                    case 'iOSApp3D':                    // AR: iOSApp3D
                        { assetUsage = 'AR'; } break;

                    default:
                        LOG.error(`Unsupported usage for download (${usage})`,LOG.LS.eHTTP);
                }
            }
        }
    }

    // get our quality level. defaulting to 'low' for AR
    let assetQuality: string = 'Undefined';
    if(quality) {
        switch(quality.toLocaleLowerCase()) {
            case 'low':     assetQuality = 'Low'; break;
            case 'medium':  assetQuality = 'Medium'; break;
            case 'high':    assetQuality = 'High'; break;
            case 'highest': assetQuality = 'Highest'; break;
            case 'ar':      assetQuality = 'Low'; break;
        }
    }

    return { usage: assetUsage, quality: assetQuality };
};
const getItemName = (item: DBAPI.Item): string => {
    let result: string = item.Name;
    if(item.Title && item.Title.length>0 && !result.includes(item.Title))
        result += ': '+item.Title;
    return result;
};
const resolvePublishedState = (state: COMMON.ePublishedState): string => {
    switch (state) {
        case COMMON.ePublishedState.eNotPublished:
            return 'Not Published';
        case COMMON.ePublishedState.eAPIOnly:
            return 'API Only';
        case COMMON.ePublishedState.ePublished:
            return 'Published';
        case COMMON.ePublishedState.eInternal:
            return 'Internal';
        default:
            return 'Unknown State';
    }
};
//#endregion