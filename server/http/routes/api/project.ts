/* eslint-disable @typescript-eslint/no-explicit-any */
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import * as COMMON from '@dpo-packrat/common';
import { ASL, LocalStore } from '../../../utils/localStore';
// import { AuditFactory } from '../../../audit/interface/AuditFactory';
import { isAuthenticated } from '../../auth';
import { Request, Response } from 'express';
import { Config } from '../../../config';

//#region Types and Definitions

// NOTE: 'Summary' types/objects are intended for return via the API and for external use
//       so non-standard types (e.g. enums) are converted to strings for clarity/accessibility.
type ProjectResponse = {
    success: boolean,           // was the request successful
    message?: string,           // errors from the request|workflow to put in console or display to user
    data?
};
type DBReference = {
    id: number,     // system object id
    name: string,   // name of object
};
type AssetSummary = DBReference & {
    downloadable: boolean,
    quality: string,
    usage: string,                  // how is this asset used. (e.g. Web, Native, AR, Master)
    dateCreated: Date,
};
type AssetList = {
    status: string,
    items: AssetSummary[];
};
type SceneSummary = DBReference & {
    publishedState: string,
    datePublished: Date,
    isReviewed: boolean
    project: DBReference,
    subject: DBReference,
    mediaGroup: DBReference,
    dateCreated: Date,
    derivatives:    {
        models: AssetList,          // holds all derivative models
        downloads: AssetList,       // specific models for download
        ar: AssetList,              // models specific to AR
    },
    sources: {
        models: AssetList,
        captureData: AssetList,
    }
};

//#endregion

//#region Get Projects & Scenes
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
    LOG.info(`API.Projects get project scenes: ${idProject}`,LOG.LS.eHTTP);

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
    const dataSize: number = JSON.stringify(scenes).length;
    LOG.info(`API.getProjectScenes processed ${result.length}/${scenes.length} scenes from Project (${(idProject<0)?'all':idProject}: ${dataSize} bytes) in ${getElapseSeconds(timestamp,Date.now())} seconds`,LOG.LS.eDEBUG);

    // return success
    res.status(200).send(JSON.stringify(generateResponse(true,`Returned ${result.length} scenes`,[...result])));
}
//#endregion

//#region Build Summary and Defs
const buildProjectSceneDef = async (scene: DBAPI.Scene, project: DBAPI.Project | null): Promise<SceneSummary | null> => {

    // debug for timing routine
    const startTime: number = Date.now();

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

    // get all models associated with the Scene
    const MSXs: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromScene(scene.idScene);
    if (!MSXs) {
        LOG.error(`API.Project.buildProjectSceneDef unable to fetch ModelSceneXrefs for scene ${scene.idScene}`, LOG.LS.eCOLL);
        return null;
    }

    // build summaries for all dependencies
    const derivativeResult = await buildSummaryDerivatives(MSXs);
    if(!derivativeResult) {
        LOG.error(`API.Project.buildProjectSceneDef unable to dependencies for scene ${scene.idScene}`, LOG.LS.eCOLL);
        return null;
    }
    const { models, downloads, ar } = derivativeResult;

    // get master model(s)
    const masterModels: AssetList | null = await buildSummaryMasterModels(scene.idScene);
    if(!masterModels) {
        LOG.error(`API.Project.buildProjectSceneDef unable get master model(s) for scene ${scene.idScene}`, LOG.LS.eCOLL);
        return null;
    }

    // get capture data reference(s)
    // TODO...

    // build our data structure to return
    const result: SceneSummary = {
        id: sceneSO.idSystemObject,
        name: scene.Name,
        dateCreated: sceneSOV.DateCreated,
        publishedState: resolvePublishedState(sceneSOV.PublishedState),
        datePublished: new Date(0), // does it exist? store epoch to signal error
        isReviewed: scene.PosedAndQCd as boolean,

        project: (project)
            ? { id: projectSO?.idSystemObject ?? -1, name: project.Name }
            : { id: -1, name: 'NA' },
        subject:
            { id: subjectSO?.idSystemObject ?? -1, name: subject.Name },
        mediaGroup:
            { id: itemSO?.idSystemObject ?? -1, name: getItemName(item) },
        derivatives:
            {
                models,
                downloads,
                ar,
            },
        sources:
            {
                models: masterModels,
                captureData: { status: '', items: [] },
            },
    };

    LOG.info(`API.Project.buildProjectSceneDef built scene summary (${(Date.now()-startTime)/1000}s): ${H.Helpers.JSONStringify(result)}`,LOG.LS.eDEBUG);
    return result;
};
const buildSummaryDerivatives = async (MSXs: DBAPI.ModelSceneXref[]): Promise<{ models: AssetList, downloads: AssetList, ar: AssetList }  | null> => {
    console.log(H.Helpers.JSONStringify(MSXs));

    // build up all of our summaries and wait for them to finish
    const buildSummaries = MSXs.map(async (MSX) => {
        try {
            const summary: AssetSummary | null = await buildAssetSummaryFromMSX(MSX);
            return summary ? { summary, MSX } : null;
        } catch (error) {
            LOG.error(`API.Project.buildSummaryDerivatives failed to build asset summary (id: ${MSX.idModelSceneXref} | model: ${MSX.idModel} | scene: ${MSX.idScene})`, LOG.LS.eHTTP);
            return null;
        }
    });
    const summaries = await Promise.all(buildSummaries);

    const models: AssetList = { status: '', items: [] };
    const downloads: AssetList = { status: '', items: [] };
    const ar: AssetList = { status: '', items: [] };

    // cycle through the summaries determining if any should be in the download list as well
    summaries.forEach(item => {
        if (item && item.summary) {
            models.items.push(item.summary);

            // if we are a downloadable model
            if (item.summary.downloadable === true)
                downloads.items.push(item.summary);

            // if we are an AR model
            if(item.summary.usage==='AR')
                ar.items.push(item.summary);
        }
    });

    // get download status
    downloads.status = getStatusDownload(downloads.items);

    ar.status = getStatusARModels(ar.items);

    // figure out our status for models
    if(downloads.status.includes('Error') || ar.status.includes('Error'))
        models.status = 'Error';
    else if(downloads.status.includes('Missing') || ar.status.includes('Missing'))
        models.status = 'Missing';
    else
        models.status = 'Good';

    return { models, downloads, ar };
};
const buildSummaryMasterModels = async (idScene: number): Promise<AssetList | null> => {

    const masterModels: DBAPI.Model[] | null = await DBAPI.Model.fetchMasterFromScene(idScene);
    if(!masterModels)
        return null;

    // default to good since it is HIGHLY unlikely for a scene to be present and no master model
    const result: AssetList = { status: 'Good', items: [] };

    // cycle through master models building summaries
    for(const model of masterModels) {
        const masterSummary: AssetSummary | null = await buildAssetSummaryFromModel(model.idModel);
        if(!masterSummary) {
            LOG.error(`API.Project.buildMasterModelSummarie unable to build summary for Master model of scene (idScene: ${idScene} | idModel: ${model.idModel})`, LOG.LS.eCOLL);
            result.status = 'SysError';
            continue;
        }

        // force highest levels for the asset
        masterSummary.quality = 'Highest';
        masterSummary.downloadable = false;

        // get our purpose to use for usage. should be 'Master' but future may
        // include 'Master:Raw' or 'Master:Presentation'
        const masterVocab: DBAPI.Vocabulary | null = await DBAPI.Vocabulary.fetch(model.idVPurpose ?? -1);
        masterSummary.usage = `Source:${masterVocab?.Term ?? 'Master'}`;

        result.items.push(masterSummary);
    }

    // if array is empty, then we have a data issue and need to make sure we signal the user
    if(result.items.length===0)
        result.status = 'SysError';

    return result;
};
const buildAssetSummaryFromModel = async (idModel: number): Promise<AssetSummary | null> => {

    // get our actual model so we can get the date created
    const model: DBAPI.Model | null = await DBAPI.Model.fetch(idModel);
    if(!model) {
        LOG.error(`API.Project.buildAssetSummaryFromModel cannot fetch model (id: ${idModel})`,LOG.LS.eDB);
        return null;
    }

    // get our asset for the model
    const modelAsset: DBAPI.Asset[] | null = await DBAPI.Asset.fetchFromModel(model.idModel);
    if(!modelAsset || modelAsset.length===0) {
        LOG.error(`API.Project.buildAssetSummaryFromModel cannot fetch asset from model (idModel: ${model.idModel} | msx: ${model.Name})`,LOG.LS.eDB);
        return null;
    } else if(modelAsset.length>1)
        LOG.info(`API.Project.buildAssetSummaryFromModel more than one asset assigned to model. using first one. (idModel: ${model.idModel} | count: ${modelAsset.length})`,LOG.LS.eDB);

    // get our system object id
    const modelSO: DBAPI.SystemObject | null = await modelAsset[0].fetchSystemObject();
    if(!modelSO) {
        LOG.error(`API.Project.buildAssetSummaryFromModel cannot fetch SystemObject model asset (idModel: ${model.idModel} | idAsset: ${modelAsset[0].idAsset} | msx: ${modelAsset[0].FileName})`,LOG.LS.eDB);
        return null;
    }

    // get our latest asset version
    const modelAssetVer: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchLatestFromAsset(modelAsset[0].fetchID());
    if(!modelAssetVer) {
        LOG.error(`API.Project.buildAssetSummaryFromModel cannot fetch asset version from from model asset (idModel: ${model.idModel} | idAsset: ${modelAsset[0].idAsset})`,LOG.LS.eDB);
        return null;
    }

    const result: AssetSummary = {
        id: modelSO.idSystemObject,
        name: modelAsset[0].FileName,
        quality: 'Highest',
        usage: 'Source',
        downloadable: false,
        dateCreated: modelAssetVer.DateCreated, // if erro store epoch as date
    };
    return result;
};
const buildAssetSummaryFromMSX = async (msx: DBAPI.ModelSceneXref): Promise<AssetSummary | null> => {

    const { usage, quality, downloadable } = getModelAssetProperties(msx);

    // get our asset summary
    const assetSummary: AssetSummary | null = await buildAssetSummaryFromModel(msx.idModel);
    if(!assetSummary)
        return null;

    // build our structure and return
    assetSummary.usage = usage;
    assetSummary.quality = quality;
    assetSummary.downloadable = downloadable;
    return assetSummary;
};
//#endregion

//#region Utility
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

    // make sure we're of specific class of user (e.g. tools)
    const authorizedUsers: number[] = [...new Set([...Config.auth.users.admin, ...Config.auth.users.tools])];
    if(!authorizedUsers.includes(LS.idUser)) {
        LOG.error(`API.getProjects failed. user is not authorized for this request (${LS.idUser})`,LOG.LS.eHTTP);
        return { success: false, error: `user (${LS.idUser}) does not have permission.` };
    }

    return { success: true };
};
const getElapseSeconds = (startTime: number, endTime: number): number => {
    return (endTime - startTime)/1000;
};
const getStatusDownload = (downloads: AssetSummary[]): string => {

    // if we have less than 6 downloads we're missing some
    if(downloads.length<6)
        return 'Missing';

    // check the dates to see if any are before a fix in Cook on June 14th, 2024
    // which better handled material properties during inspection.
    const targetDate: Date = new Date('2024-06-14T00:00:00Z');
    for(let i=0; i<downloads.length; i++) {
        if(downloads[i].dateCreated < targetDate) {
            LOG.info(`API.Project.getDownloadStatus for ${downloads[i].name} [${i}] (${downloads[i].dateCreated} - ${targetDate})`,LOG.LS.eDEBUG);
            return 'Error';
        }
    }
    return 'Good';
};
const getStatusARModels = (models: AssetSummary[]): string => {

    console.log('AR models',models);

    const targetDate: Date = new Date('2024-06-14T00:00:00Z');
    let nonDownloadableCount: number = 0;
    let downloadableCount: number = 0;

    for(const model of models) {

        // if any model is too old or prior to known error return error
        if(model.dateCreated < targetDate) {
            LOG.info(`API.Project.getStatusARModels for ${model.name} (${model.dateCreated} - ${targetDate})`,LOG.LS.eDEBUG);
            return (model.downloadable===true)?'Error: NativeAR':'Error: WebAR';
        }

        // build our counts for comparison
        if(model.downloadable===true)
            downloadableCount++;
        else
            nonDownloadableCount++;
    }

    // Check conditions based on the counts of downloadable and non-downloadable items
    if (downloadableCount === 2 && nonDownloadableCount < 1) {
        return 'Missing: WebAR';
    }

    if (nonDownloadableCount === 1 && downloadableCount < 2) {
        return 'Missing: NativeAR';
    }

    if (nonDownloadableCount === 1 && downloadableCount === 2) {
        return 'Good';
    }

    // If none of the conditions are met, log the error and return 'Unexpected'
    LOG.error(`API.Project.getStatusARModels counts (native: ${downloadableCount} | web: ${nonDownloadableCount})`,LOG.LS.eHTTP);
    return 'Unexpected';
};
const getModelAssetProperties = (MSX: DBAPI.ModelSceneXref) => {

    const voyagerUsageTypes: string[] = [
        'webAssetGlbLowUncompressed',
        'Web3D',
        'App3D',
        'iOSApp3D',
        'objZipFull',
        'gltfZipLow',
        'objZipLow'
    ];

    // cycle through suffixes to determine usage type/purpose
    // types: Web, Native, AR, Printing, Undefined
    let assetUsage: string = 'Undefined';
    if(MSX.Usage) {
        for(let i=0; i<voyagerUsageTypes.length; i++) {
            const usageType: string = voyagerUsageTypes[i];
            if(MSX.Usage.includes(usageType)) {
                switch(usageType) {
                    case 'webAssetGlbLowUncompressed':   // webAssetGlbLowUncompressed
                    case 'gltfZipLow':                   // gltfZipLow
                        { assetUsage = 'Web'; } break;

                    case 'objZipFull':                  // objZipFull
                    case 'objZipLow':                   // objZipLow
                        { assetUsage = 'Native'; } break;

                    case 'App3D':                       // AR: App3D
                    case 'iOSApp3D':                    // AR: iOSApp3D
                        { assetUsage = 'AR'; } break;

                    case 'Web3D':                       // most derivatives during scene generation
                        {
                            // check quality to see if AR or not
                            if(MSX.Quality?.toLowerCase()==='ar')
                                assetUsage = 'AR';
                            else
                                assetUsage = 'Web';
                        } break;

                    default:
                        LOG.error(`Unsupported usage for model asset (${MSX.Usage})`,LOG.LS.eHTTP);
                }
            }
        }
    }

    // get our quality level. defaulting to 'low' for AR
    let assetQuality: string = 'Undefined';
    if(MSX.Quality) {
        switch(MSX.Quality.toLocaleLowerCase()) {
            case 'low':     assetQuality = 'Low'; break;
            case 'medium':  assetQuality = 'Medium'; break;
            case 'high':    assetQuality = 'High'; break;
            case 'highest': assetQuality = 'Highest'; break;
            case 'ar':      assetQuality = 'Low'; break;
        }
    }

    // are we downloadable
    return { usage: assetUsage, quality: assetQuality, downloadable: MSX.isDownloadable() };
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