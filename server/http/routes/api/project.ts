/* eslint-disable @typescript-eslint/no-explicit-any */
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
// import * as DBC from '../../../db/connection';
import * as H from '../../../utils/helpers';
import * as COMMON from '../../../../common';
import { ASL, LocalStore } from '../../../utils/localStore';
import { PublishScene } from '../../../collections/impl/PublishScene';

// import { eEventKey } from '../../../event/interface/EventEnums';
// import { AuditFactory } from '../../../audit/interface/AuditFactory';
import { isAuthenticated } from '../../auth';

import { Request, Response } from 'express';
// import { WorkflowFactory, IWorkflowEngine, WorkflowCreateResult, WorkflowParameters } from '../../../workflow/interface';

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

// interface ProjectSceneRaw {
//     name: string,
//     subtitle: string,
//     id: number,
//     edanUUID: string,
//     isReviewed: number,
//     canPublish: number,
//     isPublished: number,
//     dateCreated: Date,
//     idProject: number,
//     nameProject: string,
//     idItem: number,
//     nameItem: string,
//     subtitleItem: string
// }

const getElapseSeconds = (startTime: number, endTime: number): number => {
    return (endTime - startTime)/1000;
};

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
    const result: ProjectScene[] = builtScenes.filter((scene): scene is ProjectScene => scene !== null);

    // initial scene gathering status output
    LOG.info(`API.getProjectScenes processed ${result.length}/${scenes.length} scenes from Project (${(idProject<0)?'all':idProject}) in ${getElapseSeconds(timestamp,Date.now())} seconds`,LOG.LS.eDEBUG);

    // return success
    console.log(`data size: ${JSON.stringify(scenes).length} bytes`);
    res.status(200).send(JSON.stringify(generateResponse(true,`Returned ${result.length} scenes`,[...result])));
}

type DBReference = {
    id: number,     // system object id
    name: string,   // name of object
};
// TODO: rename SceneSummary
type ProjectScene = DBReference & {
    project: DBReference,
    subject: DBReference,
    mediaGroup: DBReference,
    // idScene: number,
    // name: string,
    dateCreated: Date,
    hasDownloads: boolean,
    dateGenDownloads: Date,
    publishedState: COMMON.ePublishedState,
    datePublished: Date,
    isReviewed: boolean
    // TODO:
    //  list of downloads
    //  canPublish
};
const buildProjectSceneDef = async (scene: DBAPI.Scene, project: DBAPI.Project | null): Promise<ProjectScene | null> => {

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

    // get our Project if one doesn't already exist
    if(!project) {
        const projResults: DBAPI.Project[] | null = await DBAPI.Project.fetchFromScene(scene.idScene);
        if(projResults && projResults.length>0)
            project = projResults[0];
    }

    // get downloads for scene and determine if available
    const downloadMSXMap: Map<number, DBAPI.ModelSceneXref> | null = await PublishScene.computeDownloadMSXMap(scene.idScene);
    console.log(downloadMSXMap);

    // build our data structure to return
    const result: ProjectScene = {
        id: scene.idScene, //change to idSystemObject
        name: scene.Name,
        project: (project)
            ? { id: project.idProject, name: project.Name }
            : { id: -1, name: 'NA' },
        subject:
            { id: subject.idSubject, name: subject.Name },
        mediaGroup:
            { id: item.idItem, name: getItemName(item) },
        dateCreated: sceneSOV.DateCreated,
        hasDownloads: false,
        dateGenDownloads: new Date(),
        publishedState: sceneSOV.PublishedState,
        datePublished: new Date(), // does it exist?
        isReviewed: scene.PosedAndQCd as boolean
    };
    return result;

};

const getItemName = (item: DBAPI.Item): string => {
    let result: string = item.Name;
    if(item.Title && item.Title.length>0 && !result.includes(item.Title))
        result += ': '+item.Title;
    return result;
};