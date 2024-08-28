/* eslint-disable @typescript-eslint/no-explicit-any */
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
// import * as H from '../../../utils/helpers';
// import * as COMMON from '@dpo-packrat/common';
// import * as COL from '../../../collections/interface';
import { ASL, LocalStore } from '../../../utils/localStore';

import { eEventKey } from '../../../event/interface/EventEnums';
import { AuditFactory } from '../../../audit/interface/AuditFactory';
import { isAuthenticated } from '../../auth';

import { Request, Response } from 'express';
import { WorkflowFactory, IWorkflowEngine, WorkflowCreateResult, WorkflowParameters } from '../../../workflow/interface';

//#region Types and Definitions
type OpState = {                // individual state for each processed scene
    idWorkflow?: number,        // do we have a workflow/report so we can (later) jump to its status page
    idWorkflowReport?: number,  // do we have a report for this workflow to help with future polling
    isValid: boolean,           // if the referenced scene|model|etc. is has basic requirements met (e.g. scenes need to be QC'd)
    isJobRunning: boolean,      // is there a job already running
};
type OpResponse = {             // matches the expected returns on the client side and summarizes the request/responses
    success: boolean,
    message?: string,
    data?: WorkflowResponse[]
};
type WorkflowResponse = {       // general response for each
    success: boolean,           // was the request successful
    message?: string,           // errors from the request|workflow to put in console or display to user
    id?: number,                // optional number for the object this response refers to
    state?: OpState
};
//#endregion

//#region Utility
// HACK: hardcoding the job id since vocabulary is returning different values for looking up the job
//       enum should provide 149, but is returning 125. The actual idJob is 8 (see above)
const idJob: number = 8;
const generateResponse = (success: boolean, message?: string | undefined, id?: number | undefined, state?: OpState | undefined): WorkflowResponse => {
    return {
        success,
        message,
        id,
        state
    };
};
const buildOpResponse = (message: string, responses: WorkflowResponse[]): OpResponse => {
    // if empty send error response
    if(responses.length===0)
        return { success: false, message: 'no responses from operation' };

    // cycle through all responses and see if we
    return {
        success: responses.every((r)=>r.success),
        message,
        data: [...responses],
    };
};
//#endregion

const createGenSceneOp = async (idSystemObject: number, idUser: number): Promise<WorkflowResponse> => {

    // get SystemObject from DB
    const systemObject: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
    if(!systemObject) {
        LOG.error(`API.generateScene failed. cannot find SystemObject. (id:${idSystemObject})`,LOG.LS.eHTTP);
        return generateResponse(false,`cannot find SystemObject: ${idSystemObject}`,idSystemObject);
    }

    let model: DBAPI.Model | null = null;
    let scene: DBAPI.Scene | null = null;

    // if we're a model, grab it and then the scene
    if(systemObject.idModel) {
        model = await DBAPI.Model.fetchBySystemObject(idSystemObject);
        if(!model) {
            LOG.error(`API.generateScene failed. cannot find required model. (id:${idSystemObject})`,LOG.LS.eHTTP);
            return generateResponse(false,`cannot find required model: ${idSystemObject}`,idSystemObject);
        }

        // get our associated scene from the model
        // NOTE: a scene may not exist yet especially if the model is being ingested
        const scenes: DBAPI.Scene[] | null = await DBAPI.Scene.fetchChildrenScenes(model.idModel);
        if(scenes) {
            if(scenes.length>1)
                LOG.error(`API.generateScene warning. master model has multiple parent scenes (id:${idSystemObject} | count: ${scenes?.length})`,LOG.LS.eHTTP);
            scene = scenes[0];
        }

    } else if(systemObject.idScene) {
        // grab it and make sure it's a scene
        scene = await DBAPI.Scene.fetchBySystemObject(idSystemObject);
        if(!scene) {
            LOG.error(`API.generateScene failed. cannot find Scene. (id:${idSystemObject})`,LOG.LS.eHTTP);
            return generateResponse(false,`cannot find scene: ${idSystemObject}`,idSystemObject);
        }

        // get our master model
        const models: DBAPI.Model[] | null = await DBAPI.Model.fetchMasterFromScene(scene.idScene);
        if(!models || models.length>1) {
            LOG.error(`API.generateScene failed. cannot get scene's master model (id:${idSystemObject} | count: ${models?.length})`,LOG.LS.eHTTP);
            return generateResponse(false,`cannot get scene's master model: ${idSystemObject}`,idSystemObject);
        }
        model = models[0];
    }

    // if we don't have either throw an error
    if(!model) {
        LOG.error(`API.generateScene failed. Don't have prerequisites (idSystemObject: ${idSystemObject})`,LOG.LS.eHTTP);
        return generateResponse(false,'missing prerequisites',idSystemObject);
    }
    LOG.info(`API.generateScene found prerequisites (${model.idModel} | scene: ${scene?.idScene ?? 'null'})`,LOG.LS.eDEBUG);

    // if we're here then we want to try and initiate the workflow
    const wfEngine: IWorkflowEngine | null = await WorkflowFactory.getInstance();
    if(!wfEngine) {
        LOG.error(`API.generateScene failed to get WorkflowEngine. (id: ${model.idModel} | model: ${model.Name})`,LOG.LS.eHTTP);
        return generateResponse(false,'failed to get WorkflowEngine',idSystemObject);
    }

    // build our parameters for the workflow
    const workflowParams: WorkflowParameters = {
        idUserInitiator: idUser
    };

    // create our workflow for generating downloads
    const result: WorkflowCreateResult = await wfEngine.generateScene(model.idModel, scene?.idScene ?? null, workflowParams);
    // LOG.info(`API.generateScene post creation. (result: ${H.Helpers.JSONStringify(result)})`,LOG.LS.eDEBUG);

    const isValid: boolean = result.data.isValid ?? false;
    const isJobRunning: boolean = (result.data.activeJobs.length>0) ?? false;
    const idWorkflow: number | undefined = (result.data.workflow?.idWorkflow) ?? undefined;
    const idWorkflowReport: number | undefined = (result.data.workflowReport?.idWorkflowReport) ?? undefined;

    // make sure we saw success, otherwise bail
    if(result.success===false) {
        LOG.error(`API.generateScene failed to generate scene: ${result.message}`,LOG.LS.eHTTP);
        return generateResponse(false,result.message,idSystemObject,{ isValid, isJobRunning, idWorkflow, idWorkflowReport });
    }

    return generateResponse(true,`Generating Scene for: ${model.Name}`,idSystemObject,{ isValid, isJobRunning, idWorkflow, idWorkflowReport });
};
const getOpStatusForScene = async (idSystemObject: number): Promise<WorkflowResponse> => {

    // grab it and make sure it's a scene
    const model: DBAPI.Model | null = await DBAPI.Model.fetchBySystemObject(idSystemObject);
    if(!model) {
        LOG.error(`API.generateScene failed. cannot find required model. (id:${idSystemObject})`,LOG.LS.eHTTP);
        return generateResponse(false,`cannot find required model: ${idSystemObject}`,idSystemObject);
    }

    // see if scene is valid
    // is it a master model...(idVPurpose, face count, etc.)
    const isValid: boolean = true;

    // get any active jobs
    const activeJobs: DBAPI.JobRun[] | null = await DBAPI.JobRun.fetchActiveByScene(idJob,model.idModel);
    if(!activeJobs) {
        LOG.error(`API.generateScene failed. cannot determine if job is running. (idModel: ${model.idModel})`,LOG.LS.eHTTP);
        return generateResponse(false,'failed to get active jobs from DB',idSystemObject,{ isValid, isJobRunning: false });
    }

    // if we're running, we don't duplicate our efforts
    const idActiveJobRun: number[] = activeJobs.map(job => job.idJobRun);
    if(activeJobs.length > 0) {
        // get our workflow & report from the first active job id
        let idWorkflow: number | undefined = undefined;
        let idWorkflowReport: number | undefined = undefined;
        const workflowReport: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromJobRun(activeJobs[0].idJobRun);
        if(workflowReport && workflowReport.length>0) {
            idWorkflowReport = workflowReport[0].idWorkflowReport;
            idWorkflow = workflowReport[0].idWorkflow;
        } else
            LOG.info(`API.generateScene unable to get workflowReport (idModel: ${model.idModel} | idJobRun: ${activeJobs[0].idJobRun}}).`,LOG.LS.eHTTP);

        // return our response and log it
        LOG.info(`API.generateScene job already running (idModel: ${model.idModel} | idJobRun: ${idActiveJobRun.join(',')}}).`,LOG.LS.eHTTP);
        return generateResponse(false,'job already running', idSystemObject, { isValid, isJobRunning: (activeJobs.length>0), idWorkflow, idWorkflowReport });
    }

    // send our info back to the client
    LOG.info(`API.generateScene job is not running but valid. (id: ${model.idModel} | scene: ${model.Name})`,LOG.LS.eHTTP);
    return generateResponse(true,'scene is valid and no job is running', idSystemObject,{ isValid, isJobRunning: (activeJobs.length>0) });
};

export async function generateScene(req: Request, res: Response): Promise<void> {

    // make sure we're authenticated (i.e. see if request has a 'user' object)
    if (!isAuthenticated(req)) {
        AuditFactory.audit({ url: req.path, auth: false }, { eObjectType: 0, idObject: 0 }, eEventKey.eGenDownloads);
        LOG.error('API.generateScene failed. not authenticated.', LOG.LS.eHTTP);
        res.status(403).send('no authenticated');
        return;
    }

    // get our LocalStore. If we don't have one then bail. it is needed for the user id, auditing, and workflows
    const LS: LocalStore | undefined = ASL.getStore();
    if(!LS || !LS.idUser){
        LOG.error('API.generateScene failed. cannot get LocalStore or idUser',LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(false,'missing store/user')));
        return;
    }

    // get our method to see what we should do, extracting the status and IDs
    let statusOnly: boolean = true;
    let idSystemObjects: number[] = [];
    switch(req.method.toLocaleLowerCase()) {
        case 'get': {
            // GET method only returns status info. used for quick queries/checks on specific scenes
            const idSystemObject: number = parseInt((req.query.id as string) ?? '-1');
            if(idSystemObject>0)
                idSystemObjects.push(idSystemObject);
        } break;
        case 'post': {
            // POST used for batch operations or creating the job
            const body = req.body;
            statusOnly = body.statusOnly;

            if(body.idSystemObject && Array.isArray(body.idSystemObject)) {
                // if we're an array store only numbers and prune out any nulls
                idSystemObjects = body.idSystemObject.map(item => {
                    const num = Number(item);
                    return isNaN(num) ? null : num;
                }).filter((item): item is number => item !== null);

                // post message if a count difference meaning we got bad data
                if(idSystemObjects.length != body.idSystemObject.length)
                    LOG.error(`API.generateScene received ${body.idSystemObject.length-idSystemObjects.length} bad IDs. (${body.idSystemObject.join(', ')})`,LOG.LS.eHTTP);
            }
        } break;
        default: {
            LOG.error('API.generateScene failed. unsupported HTTP method',LOG.LS.eHTTP);
            res.status(400).send(JSON.stringify(generateResponse(false,'invalid HTTP method')));
            return;
        }
    }

    // make sure we have ids to work with
    if(idSystemObjects.length === 0) {
        LOG.error('API.generateScene failed. no IDs found in request.',LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(false,'invalid id parameters/body. none found.')));
        return;
    }

    // TEMP: limit IDs to a number that can be handled by Cook/Packrat
    let messageSuffix: string | null = null;
    const maxIDs: number = 10;
    if(idSystemObjects.length>maxIDs) {
        LOG.info('API.generateScene too many scenes submitted. limiting to 10',LOG.LS.eHTTP);
        messageSuffix = `(Capped to ${maxIDs})`;
        idSystemObjects.splice(10);
    }

    // cycle through IDs
    let messagePrefix: string = '';
    const responses: WorkflowResponse[] = [];
    for(let i=0; i<idSystemObjects.length; i++) {
        const idSystemObject: number = idSystemObjects[i];

        // if we only want the status then we need to do some quick checks ourself instead of WorkflowEngine
        if(statusOnly===true) {
            const result: WorkflowResponse = await getOpStatusForScene(idSystemObject);
            responses.push(result);
            messagePrefix = 'Getting Status for:';
        } else {
            // get our published state for the scene ebfore doing anything because generate downloads
            // will create a new Scene version that is unpublished, affecting our ability to re-publish
            const sceneSOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(idSystemObject ?? -1);
            if(!sceneSOV) {
                LOG.error(`API.generateScene failed to get SystemObjectVersion for scene (${idSystemObject ?? -1})`,LOG.LS.eDB);
                continue;
            }

            // create our operation and execute download generation
            const result: WorkflowResponse = await createGenSceneOp(idSystemObject,LS.idUser);
            responses.push(result);
            messagePrefix = 'Generating Scene for:';
        }
    }

    // create our combined response and return info to client
    res.status(200).send(JSON.stringify(buildOpResponse(`${messagePrefix} ${responses.length} scenes ${messageSuffix ?? ''}`,responses)));
}
