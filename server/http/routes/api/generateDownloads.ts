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
    isJobRunning: boolean,      // is there a job already running
};

type GenDownloadsResponse = {
    success: boolean,           // was the request successful
    message?: string,           // errors from the request|workflow to put in console or display to user
    data?: GenDownloadsStatus
};

// enum JobStatus {
//     UNDEFINED,
//     PENDING,
//     STARTED,
//     FINISHED,
//     ERROR,
//     RETRY
// }
// type OpsQueueItem = {
//     opState: JobStatus;
//     idSystemObject: number;
//     message?: string;
//     opStatus: GenDownloadsStatus;
// };

// HACK: hardcoding the job id since vocabulary is returning different values for looking up the job
//       enum should provide 149, but is returning 125. The actual idJob is 8 (see above)
const idJob: number = 8;
const generateResponse = (success: boolean, message?: string | undefined, data?: GenDownloadsStatus | undefined): GenDownloadsResponse => {
    return {
        success,
        message,
        data
    };
};

const createOpForScene = async (scene: DBAPI.Scene, idUser: number): Promise<GenDownloadsResponse> => {
    // if we're here then we want to try and initiate the workflow
    const wfEngine: IWorkflowEngine | null = await WorkflowFactory.getInstance();
    if(!wfEngine) {
        LOG.error(`API.generateDownloads failed to get WorkflowEngine. (id: ${scene.idScene} | scene: ${scene.Name})`,LOG.LS.eHTTP);
        return generateResponse(false,'failed to get WorkflowEngine');
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
        return generateResponse(false,result.message,{ isSceneValid, isJobRunning, idWorkflow, idWorkflowReport });
    }

    return generateResponse(true,`Generating Downloads for: ${scene.Name}`,{ isSceneValid, isJobRunning, idWorkflow, idWorkflowReport });
};
const getOpStatusForScene = async (scene: DBAPI.Scene): Promise<GenDownloadsResponse> => {

    // see if scene is valid
    // TODO: shouldn't be an error if first run by page but only when responding to user action
    const isSceneValid: boolean = (scene.PosedAndQCd)?true:false;
    if(isSceneValid === false) {
        LOG.error(`API.generateDownloads failed. scene is not QC'd. (scene:${scene.idScene})`,LOG.LS.eHTTP);
        return generateResponse(false,'scene has not be QC\'d.');
    }

    // get any active jobs
    const activeJobs: DBAPI.JobRun[] | null = await DBAPI.JobRun.fetchActiveByScene(idJob,scene.idScene);
    if(!activeJobs) {
        LOG.error(`API.generateDownloads failed. cannot determine if job is running. (idScene: ${scene.idScene})`,LOG.LS.eHTTP);
        return generateResponse(false,'failed to get active jobs from DB', { isSceneValid, isJobRunning: false });
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
            LOG.info(`API.generateDownloads unable to get workflowReport (idScene: ${scene.idScene} | idJobRun: ${activeJobs[0].idJobRun}}).`,LOG.LS.eHTTP);

        // return our response and log it
        LOG.info(`API.generateDownloads job already running (idScene: ${scene.idScene} | idJobRun: ${idActiveJobRun.join(',')}}).`,LOG.LS.eHTTP);
        return generateResponse(false,'job already running',{ isSceneValid, isJobRunning: (activeJobs.length>0), idWorkflow, idWorkflowReport });
    }

    // send our info back to the client
    LOG.info(`API.generateDownloads job is not running but valid. (id: ${scene.idScene} | scene: ${scene.Name})`,LOG.LS.eHTTP);
    return generateResponse(true,'scene is valid and no job is running',{ isSceneValid, isJobRunning: (activeJobs.length>0) });
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

    // get our LocalStore. If we don't have one then bail. it is needed for the user id, auditing, and workflows
    const LS: LocalStore | undefined = ASL.getStore();
    if(!LS || !LS.idUser){
        LOG.error('API.generateDownloads failed. cannot get LocalStore or idUser',LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(false,'missing store/user')));
        return;
    }

    // get our method to see what we should do, extracting the status and IDs
    let statusOnly: boolean = true;
    const idSystemObjects: number[] = [];
    switch(req.method.toLocaleLowerCase()) {
        case 'get': {
            // GET method only returns status info. used for quick queries/checks on specific scenes
            statusOnly = true;
            const idSystemObject: number = parseInt((req.query.id as string) ?? '-1');
            if(idSystemObject>0)
                idSystemObjects.push(idSystemObject);
        } break;
        case 'post': {
            // POST used for batch operations or creating the job
            const body = req.body;
            console.log(typeof(body));
            console.log(body);

            statusOnly = body.statusOnly;
            // sceneIDs = body.
        } break;
        default: {
            LOG.error('API.generateDownloads failed. unsupported HTTP method',LOG.LS.eHTTP);
            res.status(400).send(JSON.stringify(generateResponse(false,'invalid HTTP method')));
            return;
        }
    }

    // make sure we have ids to work with
    if(idSystemObjects.length === 0) {
        LOG.error('API.generateDownloads failed. no IDs found in request.',LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(false,'invalid id parameters/body. none found.')));
        return;
    }

    // only handle one object for the moment
    if(idSystemObjects.length>1)
        LOG.info(`API.generateDownloads only supports getting status for a single scene. choosing first one (${idSystemObjects[0]})`,LOG.LS.eHTTP);
    idSystemObjects.splice(1);

    // cycle through IDs
    for(let i=0; i<idSystemObjects.length; i++) {
        const idSystemObject: number = idSystemObjects[i];

        // grab it and make sure it's a scene
        const scene: DBAPI.Scene | null = await DBAPI.Scene.fetchBySystemObject(idSystemObject);
        if(!scene) {
            LOG.error(`API.generateDownloads failed. cannot find Scene. (id:${idSystemObject})`,LOG.LS.eHTTP);
            res.status(200).send(JSON.stringify(generateResponse(false,`cannot find scene: ${idSystemObject}`)));
            return;
        }

        // if we only want the status then we need to do some quick checks ourself instead of WorkflowEngine
        if(statusOnly===true) {
            const result: GenDownloadsResponse = await getOpStatusForScene(scene);
            res.status(200).send(JSON.stringify(result));
            return;
        } else {
            /** TODO
             * - push to queue
             * - spin up queue worker (if not already)
             *      - if active list < threshold add new one to list
             *      - cycle through active items
             *          - if finished/error remove from list and store results (just return status obj)
             *          - if active list is empty then finish and return response
             */
            const result: GenDownloadsResponse = await createOpForScene(scene,LS.idUser);
            if(result.success===false) {
                res.status(200).send(JSON.stringify(result));
            } else {
                // special response on success
                res.status(200).send(JSON.stringify(generateResponse(true,`Generating Downloads for: ${scene.Name}`, result.data))); //{ isSceneValid, isJobRunning, idWorkflow, idWorkflowReport }
            }
            return;
        }
    }
}