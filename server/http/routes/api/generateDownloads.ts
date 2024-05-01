/* eslint-disable @typescript-eslint/no-explicit-any */
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import { ASL, LocalStore } from '../../../utils/localStore';

import { eEventKey } from '../../../event/interface/EventEnums';
import { AuditFactory } from '../../../audit/interface/AuditFactory';
import { isAuthenticated } from '../../auth';

import { Request, Response } from 'express';
import { WorkflowFactory, IWorkflowEngine, WorkflowCreateResult, WorkflowParameters } from '../../../workflow/interface';

type GenDownloadsStatus = {
    idWorkflow?: number,        // do we have a workflow/report so we can (later) jump to its status page
    idWorkflowReport?: number,  // do we have a report for this workflow to help with future polling
    isSceneValid: boolean,      // if the referenced scene is QC'd and has basic requirements met
    isJobRunning: boolean,         // is there a job already running
};

type GenDownloadsResponse = {
    success: boolean,           // was the request successful
    message?: string,           // errors from the request|workflow to put in console or display to user
    data?: GenDownloadsStatus
};

const generateResponse = (success: boolean, message?: string | undefined, data?: GenDownloadsStatus | undefined): GenDownloadsResponse => {
    return {
        success,
        message,
        data
    };
};

export async function generateDownloads(req: Request, res: Response): Promise<void> {
    // LOG.info('Generating Downloads from API request...', LOG.LS.eHTTP);

    // make sure we're authenticated (i.e. see if request has a 'user' object)
    if (!isAuthenticated(req)) {
        AuditFactory.audit({ url: req.path, auth: false }, { eObjectType: 0, idObject: 0 }, eEventKey.eGenDownloads);
        LOG.error('API.generateDownloads failed. not authenticated.', LOG.LS.eHTTP);
        res.status(403).send('no authenticated');
        return;
    }

    // get our method to see what we should do
    let statusOnly: boolean = true;
    switch(req.method.toLocaleLowerCase()) {
        case 'get': statusOnly = true; break;
        case 'post': statusOnly = false; break;
        default: {
            LOG.error('API.generateDownloads failed. unsupported HTTP method',LOG.LS.eHTTP);
            res.status(400).send(JSON.stringify(generateResponse(false,'invalid HTTP method')));
            return;
        }
    }

    // get our user id
    const idUser: number = req['user'] ? req['user']['idUser'] : undefined;
    if(idUser == undefined) {
        LOG.error(`API.generateDownloads failed. invalid user id: ${req['user']}`,LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(false,'invalid user id')));
        return;
    }

    // see if our system has the useId stored
    // TODO: check our AuthFactory for status here...
    // const LS: LocalStore | undefined = await ASL.getOrCreateStore(idUser);
    const LS: LocalStore | undefined = await ASL.getOrCreateStore();
    LOG.info(`API.generateDownloads (${H.Helpers.JSONStringify(LS)})`,LOG.LS.eDEBUG);
    if(!LS) {
        LOG.error(`API.generateDownloads failed. cannot get Local Storage or auth user. (${idUser})`,LOG.LS.eHTTP);
        LOG.error(`\t ${H.Helpers.getStackTrace('(API) Generate Downloads')}`,LOG.LS.eDEBUG);
    } else if(!LS.idUser) {
        LOG.error(`API.generateDownloads failed. LocalStore is missing idUser. (${idUser})`,LOG.LS.eHTTP);
        LOG.error(`\t ${H.Helpers.getStackTrace('(API) Generate Downloads User')}`,LOG.LS.eDEBUG);
        LS.idUser = idUser;
    }
    // if(LS && !LS.idUser)
    //     LS.idUser = idUser;
    // if(!LS) {
    //     LOG.error(`API.generateDownloads failed. cannot get Local Storage or auth user. (${idUser})`,LOG.LS.eHTTP);
    //     // res.status(200).send(JSON.stringify(generateResponse(false,'cannot verify user')));
    //     // return;
    // } else if(!LS.idUser && idUser>0) {
    //     LOG.info(`API.generateDownloads manually assigning authenticated user (${idUser}) to LocalStorage.`,LOG.LS.eHTTP);
    //     LS.idUser = idUser;
    // }

    // extract query param for idSystemObject
    const idSystemObject: number = parseInt((req.query.id as string) ?? '0');
    if(idSystemObject === 0) {
        LOG.error(`API.generateDownloads failed. invalid id: ${idSystemObject}`,LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(false,`invalid id parameter: ${req.query.id ?? -1}`)));
        return;
    }

    // grab it and make sure it's a scene
    const scene: DBAPI.Scene | null = await DBAPI.Scene.fetchBySystemObject(idSystemObject);
    if(!scene) {
        LOG.error(`API.generateDownloads failed. cannot find Scene. (id:${idSystemObject})`,LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(false,`cannot find scene: ${idSystemObject}`)));
        return;
    }

    // get any generate downloads workflows/jobs running
    // HACK: hardcoding the job id since vocabulary is returning different values for looking up the job
    //       enum should provide 149, but is returning 125. The actual idJob is 8 (see above)
    const idJob: number = 8;

    // #region verify the status of the scene/workflow
    // if we only want the status then we need to do some checks ourself instead of WorkflowEngine
    if(statusOnly === true) {
        // see if scene is valid
        const isSceneValid: boolean = scene.canGenerateDownloads();
        if(isSceneValid === false) {
            LOG.error(`API.generateDownloads failed. scene is not QC'd. (id:${idSystemObject} | scene:${scene.idScene})`,LOG.LS.eHTTP);
            res.status(200).send(JSON.stringify(generateResponse(false,'scene has not be QC\'d.')));
            return;
        }

        // get any active jobs
        const activeJobs: DBAPI.JobRun[] | null = await DBAPI.JobRun.fetchActiveByScene(idJob,scene.idScene);
        if(!activeJobs) {
            LOG.error(`API.generateDownloads failed. cannot determine if job is running. (id:${idSystemObject} | idScene: ${scene.idScene})`,LOG.LS.eHTTP);
            res.status(200).send(JSON.stringify(generateResponse(false,'failed to get active jobs from DB', { isSceneValid, isJobRunning: false })));
            return;
        }

        // if we're running, we don't duplicate our efforts
        const idActiveJobRun: number[] = activeJobs.map(job => job.idJobRun);
        if(activeJobs.length > 0) {
            // TODO: return idWorkflowReport so client can create a link
            LOG.info(`API.generateDownloads job already running (idScene: ${scene.idScene} | idJobRun: ${idActiveJobRun.join(',')}}).`,LOG.LS.eWF);
            res.status(200).send(JSON.stringify(generateResponse(false,'job already running',{ isSceneValid, isJobRunning: (activeJobs.length>0) })));
            return;
        }

        // TODO: get our workflow & report from the active job id

        // send our info back to the client
        LOG.info(`API.generateDownloads job is not running but valid. (id: ${scene.idScene} | scene: ${scene.Name})`,LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(true,'scene is valid and no job is running',{ isSceneValid, isJobRunning: (activeJobs.length>0) })));
        return;
    }
    // #endregion

    // if we're here then we want to try and initiate the workflow
    const wfEngine: IWorkflowEngine | null = await WorkflowFactory.getInstance();
    if(!wfEngine) {
        LOG.error(`API.generateDownloads failed to get WorkflowEngine. (id: ${scene.idScene} | scene: ${scene.Name})`,LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(false,'failed to get WorkflowEngine')));
        return;
    }

    // build our parameters for the workflow
    const workflowParams: WorkflowParameters = {
        idUserInitiator: idUser
    };

    // create our workflow for generating downloads
    const result: WorkflowCreateResult = await wfEngine.generateDownloads(scene.idScene, workflowParams);
    LOG.info(`API.generateDownloads post creation. (result: ${H.Helpers.JSONStringify(result)})`,LOG.LS.eDEBUG);
    const isSceneValid: boolean = result.data.isSceneValid ?? false;
    const isJobRunning: boolean = (result.data.activeJobs.length>0) ?? false;
    const idWorkflow: number | undefined = (result.data.workflow?.idWorkflow) ?? undefined;
    const idWorkflowReport: number | undefined = (result.data.workflowReport?.idWorkflowReport) ?? undefined;

    // make sure we saw success, otherwise bail
    if(result.success===false) {
        LOG.error(`API.generateDownloads failed to generate downloads: ${result.message}`,LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(false,result.message,{ isSceneValid, isJobRunning })));
        return;
    }

    // return success
    res.status(200).send(JSON.stringify(generateResponse(true,`Generating Downloads for: ${scene.Name}`,{ isSceneValid, isJobRunning, idWorkflow, idWorkflowReport })));
}