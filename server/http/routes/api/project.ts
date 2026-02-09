/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import * as COMMON from '@dpo-packrat/common';
import { ASL, LocalStore } from '../../../utils/localStore';
// import { AuditFactory } from '../../../audit/interface/AuditFactory';
import { isAuthenticated } from '../../auth';
import { Request, Response } from 'express';
import { Config } from '../../../config';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

//#region Types and Definitions
// NOTE: 'Summary' types/objects are intended for return via the API and for external use
//       so non-standard types (e.g. enums) are converted to strings for clarity/accessibility.
type ProjectResponse = {
    success: boolean,           // was the request successful
    message?: string,           // errors from the request|workflow to put in console or display to user
    data?
};
type AssetSummary = DBAPI.DBReference & {
    downloadable: boolean,
    quality: string,
    usage: string,                  // how is this asset used. (e.g. Web, Native, AR, Master)
    dateCreated: Date,
    dateModified: Date,
    creator: {                      // who created the asset
        idUser: number,
        email: string,
        name: string,
    },
};
type AssetList = {
    status: string,                 // Missing, Error, Good, SysError
    items: AssetSummary[];
    expected?: number;               // how many items may be expected or found elsewhere
};
type SubjectSummary = DBAPI.DBReference & {
    arkId: string
};
export type SceneSummary = DBAPI.DBReference & {
    publishedState: string,
    datePublished: Date,
    isReviewed: boolean
    project: DBAPI.DBReference,
    subject: SubjectSummary,
    mediaGroup: DBAPI.DBReference,
    dateCreated: Date,
    dateModified: Date,
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
        RK.logError(RK.LogSection.eHTTP,'get projects failed',error,{},'HTTP.Route.Project');
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
    RK.logInfo(RK.LogSection.eHTTP,'get projects failed',`get project scenes: ${idProject}`,{},'HTTP.Route.Project');

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
            RK.logError(RK.LogSection.eHTTP,'get project scenes failed',error,{},'HTTP.Route.Project');
            res.status(200).send(JSON.stringify(generateResponse(false,error)));
            return;
        }

        // get our scenes for the project
        scenes = await DBAPI.Scene.fetchByProjectID(project.idProject);
    }

    // make sure we have scenes
    if(!scenes) {
        const error = `cannot get scenes from Project in DB (${idProject})`;
        RK.logError(RK.LogSection.eHTTP,'get project scenes failed',error,{},'HTTP.Route.Project');
        res.status(200).send(JSON.stringify(generateResponse(false,error)));
        return;
    } else if(scenes.length===0) {
        res.status(200).send(JSON.stringify(generateResponse(true,'Returned 0 scenes',[])));
        return;
    }

    // initial scene gathering status output
    RK.logDebug(RK.LogSection.eHTTP,'get project scenes',`grabbed ${scenes.length} scenes from Project (${(idProject<0)?'all':idProject}) in ${getElapseSeconds(timestamp,Date.now())} seconds`,{},'HTTP.Route.Project');
    timestamp = Date.now();

    // cycle through scenes building results, and removing any that are null
    // const buildScenePromises = scenes.map(scene => buildProjectSceneDef(scene, project));
    // const builtScenes = await Promise.all(buildScenePromises);
    // const result: SceneSummary[] = builtScenes.filter((scene): scene is SceneSummary => scene !== null);
    const concurrencyLimit = 5; // Adjust based on server load
    const result: SceneSummary[] = await processScenesWithLimit(scenes, project, concurrencyLimit);

    // initial scene gathering status output
    const dataSize: number = JSON.stringify(scenes).length;
    RK.logInfo(RK.LogSection.eHTTP,'get project scenes success',`processed ${result.length}/${scenes.length} scenes from Project (${(idProject<0)?'all':idProject}: ${dataSize} bytes) in ${getElapseSeconds(timestamp,Date.now())} seconds`,{},'HTTP.Route.Project');

    // return success
    res.status(200).send(JSON.stringify(generateResponse(true,`Returned ${result.length} scenes`,[...result])));
}
//#endregion

//#region Build Summary and Defs
export const buildProjectSceneDef = async (scene: DBAPI.Scene, project: DBAPI.Project | null): Promise<SceneSummary | null> => {

    // debug for timing routine
    const startTime: number = Date.now();

    // get published state and properties (SystemObjectVersion)
    const sceneSO: DBAPI.SystemObject | null = await scene.fetchSystemObject();
    if(!sceneSO) {
        RK.logError(RK.LogSection.eHTTP,'build scene def failed','cannot get scene SystemObject',{ ...scene },'HTTP.Route.Project');
        return null;
    }

    // get all system object versions which represent changes to the
    // scene. We do this to get the earliest and current states of the scene
    const sceneSOVs: DBAPI.SystemObjectVersion[] | null = await DBAPI.SystemObjectVersion.fetchFromSystemObject(sceneSO.idSystemObject);
    if(!sceneSOVs || sceneSOVs.length===0) {
        RK.logError(RK.LogSection.eHTTP,'build scene def failed','cannot get SystemObjectVersion for scene',{ ...scene },'HTTP.Route.Project');
        return null;
    }

    // get the latest version by ID (not by date) - this matches how the scene detail view determines published state
    // Using fetchLatestFromSystemObject ensures consistency with the rest of the application
    const sceneVersionLast: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(sceneSO.idSystemObject);

    // get earliest version by date for dateCreated field
    let sceneVersionFirst: DBAPI.SystemObjectVersion | null = null;
    for(const version of sceneSOVs) {
        const date = new Date(version.DateCreated);
        if (!sceneVersionFirst?.DateCreated || date < sceneVersionFirst.DateCreated) {
            sceneVersionFirst = version;
        }
    }

    // get our item
    const itemResults: DBAPI.Item[] | null = await DBAPI.Item.fetchMasterFromScenes([scene.idScene]);
    if(!itemResults || itemResults.length===0) {
        RK.logError(RK.LogSection.eHTTP,'build scene def failed','cannot get Item from scene',{ ...scene },'HTTP.Route.Project');
        return null;
    } else if(itemResults.length > 1) {
        RK.logError(RK.LogSection.eHTTP,'build scene def failed','scene has more than one Media Group',{ scene, idItems: itemResults.map((i)=>i.idItem) },'HTTP.Route.Project');
    }
    const item: DBAPI.Item = itemResults[0];
    const itemSO: DBAPI.SystemObject | null = await item.fetchSystemObject();

    // get our Subject
    const subjectResults: DBAPI.Subject[] | null = await DBAPI.Subject.fetchMasterFromItems([item.idItem]);
    let subjectAltName: string | null = null;
    if(!subjectResults || subjectResults.length===0) {
        RK.logError(RK.LogSection.eHTTP,'build scene def failed','cannot get Subject',{ ...scene },'HTTP.Route.Project');
        return null;
    } else if(subjectResults.length > 1) {
        // if we have more than one subject assigned (error) then we concat the names so it's clear
        // on the front end too.
        RK.logError(RK.LogSection.eHTTP,'build scene def failed','MediaGroup of scene has more than one subject',{ item, scene, idSubjects: subjectResults.map((i)=>i.idSubject) },'HTTP.Route.Project');
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

    // get identifiers for the Subject (get ARK)
    let subjectArk: string = '';
    const subjectIdentifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromSystemObject(subjectSO?.idSystemObject ?? -1);
    if(!subjectIdentifiers || subjectIdentifiers.length<=0) {
        RK.logError(RK.LogSection.eHTTP,'build scene def','no identifiers found on Subject',{ ...scene },'HTTP.Route.Project');
        subjectArk = 'Not Found';
    } else {
        // cycle through identifiers looking for ARK ID
        const arkIDs: DBAPI.Identifier[] | null = subjectIdentifiers.filter( i => {
            return i.idVIdentifierType===79; // HACK: should be COMMON.eVocabularyID.eIdentifierIdentifierTypeARK but that returns zero
        });
        if(!arkIDs || arkIDs.length<=0) {
            RK.logError(RK.LogSection.eHTTP,'build scene def','no ARK identifiers found on Subject',{ idScene: scene.idScene, subjectIdentifiers: H.Helpers.JSONStringify(subjectIdentifiers) },'HTTP.Route.Project');
            subjectArk = 'Not Found';
        } else {
            if(arkIDs.length>1)
                RK.logWarning(RK.LogSection.eHTTP,'build scene def','more than one ARK ID found on subject. using first',{ idScene: scene.idScene, subjectIdentifiers: H.Helpers.JSONStringify(subjectIdentifiers) },'HTTP.Route.Project');
            const arkID: DBAPI.Identifier = arkIDs[0];
            subjectArk = arkID.IdentifierValue;
        }
    }

    // get all models associated with the Scene
    const MSXs: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromScene(scene.idScene);
    if (!MSXs) {
        RK.logError(RK.LogSection.eHTTP,'build scene def failed','unable to fetch ModelSceneXrefs for scene',{ ...scene },'HTTP.Route.Project');
        return null;
    }

    // build summaries for all dependencies
    const derivativeResult = await buildSummaryDerivatives(MSXs);
    if(!derivativeResult) {
        RK.logError(RK.LogSection.eHTTP,'build scene def failed','unable to dependencies for scene',{ ...scene },'HTTP.Route.Project');
        return null;
    }
    const { models, downloads, ar } = derivativeResult;

    // get master model(s)
    const masterModels: AssetList | null = await buildSummaryMasterModels(scene.idScene);
    if(!masterModels) {
        RK.logError(RK.LogSection.eHTTP,'build scene def failed','unable get master model(s) for scene',{ ...scene },'HTTP.Route.Project');
        return null;
    }

    // the id we get for master model is the idSystemObject so we need to get an array
    // of idModel to find the capture data
    const idModels: number[] = [];
    for(let i=0; i<masterModels.items.length; i++) {
        const model: DBAPI.Model | null = await DBAPI.Model.fetchBySystemObject(masterModels.items[i].id);
        if(model) idModels.push(model.idModel);
    }

    // get the number of master models from the Subject in case it's not linked to the scene
    if(masterModels)
        masterModels.expected = await getMasterModelsFromItems([item.idItem]) ?? 0;

    // build our summary for CaptureData. Returned items represents a singler list of all datasets
    // also, get the number of CaptureData for the Subject as it may differ
    const captureData: AssetList | null = await buildSummaryCaptureData(idModels);
    if(captureData) {
        // update our status based on capture data availability
        captureData.expected = await getCaptureDataFromItems([item.idItem]) ?? 0;
        captureData.status = getStatusCaptureData(captureData);
    }

    // build our data structure to return
    const result: SceneSummary = {
        id: sceneSO.idSystemObject,
        name: scene.Name,
        dateCreated: sceneVersionFirst?.DateCreated ?? new Date(0),
        dateModified: sceneVersionLast?.DateCreated ?? new Date(0),
        publishedState: resolvePublishedState(sceneVersionLast?.PublishedState ?? COMMON.ePublishedState.eNotPublished),
        datePublished: new Date(0), // does it exist? store epoch to signal error
        isReviewed: scene.PosedAndQCd as boolean,

        project: (project)
            ? { id: projectSO?.idSystemObject ?? -1, name: project.Name }
            : { id: -1, name: 'NA' },
        subject:
            { id: subjectSO?.idSystemObject ?? -1, name: subject.Name, arkId: subjectArk },
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
                models: masterModels ?? { status: 'Missing', items: [] },
                captureData: captureData ?? { status: 'Missing', items: [], expected: 0 },
            },
    };

    RK.logDebug(RK.LogSection.eHTTP,'build scene def',`built scene summary (name: ${result.name} | time: ${(Date.now()-startTime)/1000}s)`,{},'HTTP.Route.Project');
    return result;
};
const buildSummaryDerivatives = async (MSXs: DBAPI.ModelSceneXref[]): Promise<{ models: AssetList, downloads: AssetList, ar: AssetList }  | null> => {

    // build up all of our summaries and wait for them to finish
    const buildSummaries = MSXs.map(async (MSX) => {
        try {
            const summary: AssetSummary | null = await buildAssetSummaryFromMSX(MSX);
            return summary ? { summary, MSX } : null;
        } catch (error) {
            RK.logError(RK.LogSection.eHTTP,'build scene derivatives failed','build asset summary',{ ...MSX },'HTTP.Route.Project');
            return null;
        }
    });
    const summaries = await Promise.all(buildSummaries);

    // our various lists derived from the main model/scene
    // models: basic models for Voyager
    // downloads: models that are flagged for download on the website
    // ar: models specific to AR. includes Voyager and download versions
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
            if(item.summary.usage.includes('AR'))
                ar.items.push(item.summary);
        }
    });

    // see if we have the minimum models for Voyager
    models.status = getStatusCoreModels(models.items);

    // get download status
    downloads.status = getStatusDownload(downloads.items);

    // get AR model status
    ar.status = getStatusARModels(ar.items);

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
            RK.logError(RK.LogSection.eHTTP,'build scene derivatives failed','unable to build summary for Master model of scene',{ idScene, model },'HTTP.Route.Project');
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
const buildSummaryCaptureData = async (idModels: number[]): Promise<AssetList | null> => {
    // TODO: separate master models so each has a status and list
    // of capture data associated with it
    const result: AssetList = { status: 'Missing', items: [], expected: 0 };

    // cycle through master models
    let hasError: boolean = false;
    for(let i=0; i<idModels.length; i++) {

        // get any CaptureData associated with the provided master model
        const captureData: DBAPI.CaptureData[] | null = await DBAPI.CaptureData.fecthFromModel(idModels[i]);
        if(!captureData)
            return result;

        // build items
        for(let i=0; i<captureData.length; i++) {

            // get our system object id
            const cdSO = await captureData[i].fetchSystemObject();
            if(!cdSO) { continue; }

            // get the asset and asset version for access to creator and date info
            // only using first asset since there is no explicit access to the original 'zip'
            // asset so we must pull one of the images and use its information.
            // if we don't have an asset or assetVersion then we throw an error (9)invalid captuire data set)
            const assetSO: DBAPI.Asset[] | null = await DBAPI.Asset.fetchFromSystemObject(cdSO?.fetchID());
            if(!assetSO || assetSO.length===0) { hasError=true; continue; }
            const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchLatestFromAsset(assetSO[0].idAsset);
            if(!assetVersion) { hasError=true; continue; }

            // get our user/creator of this asset
            const user: DBAPI.User | null = await DBAPI.User.fetch(assetVersion.idUserCreator);

            const asset: AssetSummary = {
                id: cdSO.idSystemObject,
                name: captureData[i].Name,
                downloadable: false,
                quality: 'Highest' ,                        // assuming the best quality
                usage: 'Source:CaptureData',                // TODO: extract dataset usage metadata
                dateCreated: captureData[i].DateCaptured,   // when was the capture dataset captured/created
                dateModified: assetVersion.DateCreated,     // when was the latest asset version created/modified
                creator: {
                    idUser: user?.idUser ?? -1,
                    email: user?.EmailAddress ?? 'undefined',
                    name: user?.Name ?? 'unknown',
                },
            };

            // add to list
            result.items.push(asset);
        }
    }

    // update our status for the group of capture data
    if(hasError===true)
        result.status = 'Error';
    else if(result.items.length>0)
        result.status = 'Good';
    else
        result.status = 'Missing';

    return result;
};

const buildAssetSummaryFromModel = async (idModel: number): Promise<AssetSummary | null> => {

    // get our actual model so we can get the date created
    const model: DBAPI.Model | null = await DBAPI.Model.fetch(idModel);
    if(!model) {
        RK.logError(RK.LogSection.eHTTP,'build asset summary from model failed','cannot fetch model',{ idModel },'HTTP.Route.Project');
        return null;
    }

    // get our system object id for the model (just using original)
    const modelSO: DBAPI.SystemObject | null = await model.fetchSystemObject();
    if(!modelSO) {
        RK.logError(RK.LogSection.eHTTP,'build asset summary from model failed','cannot fetch SystemObject model',{ ...model },'HTTP.Route.Project');
        return null;
    }

    const result: AssetSummary = {
        id: modelSO.idSystemObject,
        name: model.Name,
        quality: 'Highest',
        usage: 'Source',
        downloadable: false,
        dateCreated: new Date(),
        dateModified: new Date(),
        creator: { idUser: -1, name: '', email: '' },
    };

    // get our asset for the model
    // NOTE: there will often be 3+ for a single model (ex. obj, mtl, jpg)
    const modelAsset: DBAPI.Asset[] | null = await DBAPI.Asset.fetchFromModel(model.idModel);
    if(!modelAsset || modelAsset.length===0) {
        RK.logError(RK.LogSection.eHTTP,'build asset summary from model failed','cannot fetch asset from model',{ ...model },'HTTP.Route.Project');
        return null;
    } else if(modelAsset.length>1)
        RK.logWarning(RK.LogSection.eHTTP,'build asset summary from model failed','more than one asset assigned to model. using first one.',{ ...model, numAssets: modelAsset.length },'HTTP.Route.Project');

    // get our latest asset version
    const modelAssetVer: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchLatestFromAsset(modelAsset[0].fetchID());
    if(!modelAssetVer) {
        RK.logError(RK.LogSection.eHTTP,'build asset summary from model failed','cannot fetch asset version from from model asset',{ model, idAsset: modelAsset[0].idAsset },'HTTP.Route.Project');
        return null;
    }

    // get our user who created the current version of the asset
    const modelCreator: DBAPI.User | null = await DBAPI.User.fetch(modelAssetVer.idUserCreator);
    if(!modelCreator)
        RK.logError(RK.LogSection.eHTTP,'build asset summary from model failed','did not find creator account attached to this model',{ model, idAsset: modelAssetVer.idAsset, idUserCreator: modelAssetVer.idUserCreator },'HTTP.Route.Project');

    // determine who created this asset (if possible)
    result.creator = {
        idUser: modelCreator?.idUser ?? -1,
        name: modelCreator?.Name ?? 'unknown',
        email: modelCreator?.EmailAddress ?? 'undefined',
    };
    result.dateCreated = model.DateCreated;             // when was model created
    result.dateModified = modelAssetVer.DateCreated;    // when was the latest asset version created/modified

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

const getMasterModelsFromItems = async (idItems: number[]): Promise<number | null> => {
    // get all master models from the items
    const masterModels: DBAPI.Model[] | null = await DBAPI.Model.fetchDerivedFromItems(idItems);
    if(!masterModels) return null;

    // confirm they are all master models (purpose = 45)
    const count: number = masterModels.filter(model => model.idVPurpose === 45).length;

    // return our count
    return count ?? null;
};
const getCaptureDataFromItems = async (idItems: number[]): Promise<number | null> => {
    // get all capture data from the items
    const captureData: DBAPI.CaptureData[] | null = await DBAPI.CaptureData.fetchDerivedFromItems(idItems);

    // return our count
    return captureData?.length ?? null;
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
        RK.logError(RK.LogSection.eHTTP,'is authorized failed','not authenticated',{},'HTTP.Route.Project');
        return { success: false, error: 'not authenticated' };
    }

    // get our LocalStore. If we don't have one then bail. it is needed for the user id, auditing, and workflows
    const LS: LocalStore | undefined = ASL.getStore();
    if(!LS || !LS.idUser){
        RK.logError(RK.LogSection.eHTTP,'is authorized failed','cannot get LocalStore or idUser',{},'HTTP.Route.Project');
        return { success: false, error: `missing local store/user (${LS?.idUser})` };
    }

    // make sure we're of specific class of user (e.g. tools)
    const authorizedUsers: number[] = [...new Set([...Config.auth.users.admin, ...Config.auth.users.tools])];
    if(!authorizedUsers.includes(LS.idUser)) {
        RK.logError(RK.LogSection.eHTTP,'is authorized failed','user is not authorized for this request',{},'HTTP.Route.Project');
        return { success: false, error: `user (${LS.idUser}) does not have permission.` };
    }

    return { success: true };
};
const getElapseSeconds = (startTime: number, endTime: number): number => {
    return (endTime - startTime)/1000;
};
const getStatusCoreModels = (models: AssetSummary[]): string => {

    // required combinations needed (e.g. by Voyager)
    const requiredCombinations = [
        { usage: 'Web', quality: 'Thumb' },
        { usage: 'Web', quality: 'Low' },
        { usage: 'Web', quality: 'Medium' },
        { usage: 'Web', quality: 'High' },
        { usage: 'Web|AR', quality: 'Low' }
    ];

    // make sure every combination above is accounted for
    // TODO: return array of missing combinations for better error handling/reporting
    return requiredCombinations.every(({ usage, quality }) =>
        models.some(obj =>
            obj.quality === quality &&
            (obj.usage === usage || (usage === 'Web|AR' && (obj.usage === 'Web' || obj.usage === 'AR')))
        )
    ) ? 'Good':'Missing';
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
            RK.logDebug(RK.LogSection.eHTTP,'get download model status',`${downloads[i].name} [${i}] (${downloads[i].dateCreated} - ${targetDate})`,{},'HTTP.Route.Project');
            return 'Error';
        }
    }
    return 'Good';
};
const getStatusARModels = (models: AssetSummary[]): string => {

    // if no AR models found, return explicit status
    if (!models || models.length === 0) {
        return 'Missing: All';
    }

    const targetDate: Date = new Date('2024-06-14T00:00:00Z');
    let nonDownloadableCount: number = 0;
    let downloadableCount: number = 0;

    for(const model of models) {

        // if any model's asset version is too old or prior to known error return error
        // use dateModified (asset version date) not dateCreated (model record date)
        if(model.dateModified < targetDate) {
            RK.logDebug(RK.LogSection.eHTTP,'get AR model status',`${model.name} (${model.dateModified} - ${targetDate})`,{},'HTTP.Route.Project');
            return (model.downloadable===true)?'Error: NativeAR':`Error: ${model.name} (${model.dateModified} - ${targetDate}) WebAR`;
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

    // If none of the conditions are met, log and return descriptive error
    RK.logError(RK.LogSection.eHTTP,'get AR model status failed','unexpected counts',{ native: downloadableCount, web: nonDownloadableCount },'HTTP.Route.Project');
    return `Error: Unexpected (WebAR:${nonDownloadableCount}, NativeAR:${downloadableCount})`;
};
const getStatusCaptureData = (cd: AssetList): string => {

    // if we have an error then return it as a system level error
    if(cd.status==='Error')
        return 'SysError';

    // extract the count and expected
    const count: number = cd.items?.length ?? 0;
    const expected: number = cd.expected ?? 0;

    if (count === 0 && expected <= 0)
        return 'Missing';                       // nothing linked to the master model or item
    else if(expected > 0 && count < expected)
        return 'Error';                         // linking error. more linked to item than master model
    else if(count === expected)
        return 'Good';                          // everything linked correctly
    else if(count > expected)
        return 'Error';                         // model should not have a dataset, but does (e.g. CAD)
    else
        return 'Unknown';                       // unknown fallback
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
                                assetUsage = 'Web|AR'; // include both
                            else
                                assetUsage = 'Web';
                        } break;

                    default:
                        RK.logError(RK.LogSection.eHTTP,'get model asset properties failed','unsupported usage for model asset',{ usage: MSX.Usage },'HTTP.Route.Project');
                }
            }
        }
    }

    // get our quality level. defaulting to 'low' for AR
    let assetQuality: string = 'Undefined';
    if(MSX.Quality) {
        switch(MSX.Quality.toLocaleLowerCase()) {
            case 'thumb':   assetQuality = 'Thumb'; break;
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
const processScenesWithLimit = async (
    scenes: DBAPI.Scene[],
    project: DBAPI.Project | null,
    concurrency: number
): Promise<SceneSummary[]> => {
    const results: SceneSummary[] = [];
    let index = 0;

    // Worker function to process scenes with rate limiting
    const worker = async () => {
        while (index < scenes.length) {
            const sceneIndex = index++; // Assign the next scene to process
            const scene = scenes[sceneIndex];

            try {
                const result = await buildProjectSceneDef(scene, project);
                if (result) results.push(result);
            } catch (error) {
                RK.logError(RK.LogSection.eHTTP,'process scenes failed',`cannot process scene ${scene.idScene}: ${error}`,{},'HTTP.Route.Project');
            }
        }
    };

    // Create `concurrency` number of workers running in parallel
    await Promise.all(Array.from({ length: concurrency }, worker));

    return results;
};
//#endregion