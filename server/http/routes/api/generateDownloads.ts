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

type OpState = {
    idWorkflow?: number,        // do we have a workflow/report so we can (later) jump to its status page
    idWorkflowReport?: number,  // do we have a report for this workflow to help with future polling
    isValid: boolean,           // if the referenced scene|model|etc. is has basic requirements met (e.g. scenes need to be QC'd)
    isJobRunning: boolean,      // is there a job already running
};
type OpResponse = {             // matches the expected returns on the client side and summarizes the request/responses
    success: boolean,
    message?: string,
    data?: GenDownloadsResponse[]
};
type GenDownloadsResponse = {
    success: boolean,           // was the request successful
    message?: string,           // errors from the request|workflow to put in console or display to user
    id?: number,                // optional number for the object this response refers to
    state?: OpState
};

// HACK: hardcoding the job id since vocabulary is returning different values for looking up the job
//       enum should provide 149, but is returning 125. The actual idJob is 8 (see above)
const idJob: number = 8;
const generateResponse = (success: boolean, message?: string | undefined, id?: number | undefined, state?: OpState | undefined): GenDownloadsResponse => {
    return {
        success,
        message,
        id,
        state
    };
};
const buildOpResponse = (message: string, responses: GenDownloadsResponse[]): OpResponse => {
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

const createOpForScene = async (idSystemObject: number, idUser: number): Promise<GenDownloadsResponse> => {
    // grab it and make sure it's a scene
    const scene: DBAPI.Scene | null = await DBAPI.Scene.fetchBySystemObject(idSystemObject);
    if(!scene) {
        LOG.error(`API.generateDownloads failed. cannot find Scene. (id:${idSystemObject})`,LOG.LS.eHTTP);
        return generateResponse(false,`cannot find scene: ${idSystemObject}`,idSystemObject);
    }

    // if we're here then we want to try and initiate the workflow
    const wfEngine: IWorkflowEngine | null = await WorkflowFactory.getInstance();
    if(!wfEngine) {
        LOG.error(`API.generateDownloads failed to get WorkflowEngine. (id: ${scene.idScene} | scene: ${scene.Name})`,LOG.LS.eHTTP);
        return generateResponse(false,'failed to get WorkflowEngine',idSystemObject);
    }

    // build our parameters for the workflow
    const workflowParams: WorkflowParameters = {
        idUserInitiator: idUser
    };

    // create our workflow for generating downloads
    const result: WorkflowCreateResult = await wfEngine.generateDownloads(scene.idScene, workflowParams);
    LOG.info(`API.generateDownloads post creation. (result: ${H.Helpers.JSONStringify(result)})`,LOG.LS.eDEBUG);
    const isValid: boolean = result.data.isValid ?? false;
    const isJobRunning: boolean = (result.data.activeJobs.length>0) ?? false;
    const idWorkflow: number | undefined = (result.data.workflow?.idWorkflow) ?? undefined;
    const idWorkflowReport: number | undefined = (result.data.workflowReport?.idWorkflowReport) ?? undefined;

    // make sure we saw success, otherwise bail
    if(result.success===false) {
        LOG.error(`API.generateDownloads failed to generate downloads: ${result.message}`,LOG.LS.eHTTP);
        return generateResponse(false,result.message,idSystemObject,{ isValid, isJobRunning, idWorkflow, idWorkflowReport });
    }

    return generateResponse(true,`Generating Downloads for: ${scene.Name}`,idSystemObject,{ isValid, isJobRunning, idWorkflow, idWorkflowReport });
};
const getOpStatusForScene = async (idSystemObject: number): Promise<GenDownloadsResponse> => {

    // grab it and make sure it's a scene
    const scene: DBAPI.Scene | null = await DBAPI.Scene.fetchBySystemObject(idSystemObject);
    if(!scene) {
        LOG.error(`API.generateDownloads failed. cannot find Scene. (id:${idSystemObject})`,LOG.LS.eHTTP);
        return generateResponse(false,`cannot find scene: ${idSystemObject}`,idSystemObject);
    }

    // see if scene is valid
    // TODO: shouldn't be an error if first run by page but only when responding to user action
    const isValid: boolean = (scene.PosedAndQCd)?true:false;
    if(isValid === false) {
        LOG.error(`API.generateDownloads failed. scene is not QC'd. (scene:${scene.idScene})`,LOG.LS.eHTTP);
        return generateResponse(false,'scene has not be QC\'d.',idSystemObject);
    }

    // get any active jobs
    const activeJobs: DBAPI.JobRun[] | null = await DBAPI.JobRun.fetchActiveByScene(idJob,scene.idScene);
    if(!activeJobs) {
        LOG.error(`API.generateDownloads failed. cannot determine if job is running. (idScene: ${scene.idScene})`,LOG.LS.eHTTP);
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
            LOG.info(`API.generateDownloads unable to get workflowReport (idScene: ${scene.idScene} | idJobRun: ${activeJobs[0].idJobRun}}).`,LOG.LS.eHTTP);

        // return our response and log it
        LOG.info(`API.generateDownloads job already running (idScene: ${scene.idScene} | idJobRun: ${idActiveJobRun.join(',')}}).`,LOG.LS.eHTTP);
        return generateResponse(false,'job already running', idSystemObject, { isValid, isJobRunning: (activeJobs.length>0), idWorkflow, idWorkflowReport });
    }

    // send our info back to the client
    LOG.info(`API.generateDownloads job is not running but valid. (id: ${scene.idScene} | scene: ${scene.Name})`,LOG.LS.eHTTP);
    return generateResponse(true,'scene is valid and no job is running', idSystemObject,{ isValid, isJobRunning: (activeJobs.length>0) });
};

// queue management
// enum OpStatus {
//     UNDEFINED,
//     PENDING,
//     RUNNING,
//     FINISHED,
//     ERROR,
//     RETRY
// }
// type OpsQueueItem = {
//     status: OpStatus;
//     idSystemObject: number;
//     message?: string;
//     response: Promise<GenDownloadsResponse> | null;
// };
// const processScenes = async (idSystemObjects: number[], idUser: number): Promise<GenDownloadsResponse[]> => {
//     const maxActive: number = 3;

//     // add our ids to the queue
//     const queue: OpsQueueItem[] = idSystemObjects.map((id) => ({
//         status: OpStatus.PENDING,
//         idSystemObject: id,
//         response: null,
//     }));

//     // hold our active items and any returned promises
//     const active: Set<OpsQueueItem> = new Set();
//     const responses: GenDownloadsResponse[] = [];

//     // function to process the next item checking that we're not exceeding our
//     // concurrency and checking status of all items
//     const processNext = async () => {
//         // if over our max active, just return (nothing to add)
//         if (active.size >= maxActive) return;

//         // find the next item based on the status. find is sequential so we get a FIFO behavior
//         const nextItem: OpsQueueItem | undefined = queue.find(item => item.status === OpStatus.PENDING || item.status === OpStatus.RETRY);
//         if (!nextItem) return;

//         // update our status and add to list of active items
//         nextItem.status = OpStatus.RUNNING;
//         active.add(nextItem);

//         try {
//             // we create the op and wait for it to finish
//             // TODO: returns FINISH before checking state of the workflow
//             nextItem.response = createOpForScene(nextItem.idSystemObject, idUser);
//             const response = await nextItem.response;
//             responses.push(response);
//             nextItem.status = OpStatus.FINISHED;
//         } catch (error) {
//             // set our error and push a failed attempt into our responses
//             nextItem.status = OpStatus.ERROR;
//             nextItem.message = error as string;
//             responses.push(generateResponse(false,error as string,nextItem.idSystemObject));
//         } finally {
//             // remove from our active items and process a new one
//             active.delete(nextItem);
//             processNext();
//         }
//     };

//     // cycle through all queue items constantly
//     while (queue.some(item => item.status !== OpStatus.FINISHED && item.status !== OpStatus.ERROR)) {
//         if (active.size < maxActive) {
//             processNext();
//         }
//         await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to prevent tight loop
//     }

//     return responses;
// };

export async function generateDownloads(req: Request, res: Response): Promise<void> {

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
    let idSystemObjects: number[] = [];
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
            statusOnly = body.statusOnly;
            if(body.idSystemObject && Array.isArray(body.idSystemObject)) {
                // if we're an array store only numbers and prune out any nulls
                idSystemObjects = body.idSystemObject.map(item => {
                    const num = Number(item);
                    return isNaN(num) ? null : num;
                }).filter((item): item is number => item !== null);

                // post message if a count difference meaning we got bad data
                if(idSystemObjects.length != body.idSystemObject.length)
                    LOG.error(`API.generateDownloads received ${body.idSystemObject.length-idSystemObjects.length} bad IDs. (${body.idSystemObject.join(', ')})`,LOG.LS.eHTTP);
            }
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

    // cycle through IDs
    let messagePrefix: string = '';
    const responses: GenDownloadsResponse[] = [];
    for(let i=0; i<idSystemObjects.length; i++) {
        const idSystemObject: number = idSystemObjects[i];

        // if we only want the status then we need to do some quick checks ourself instead of WorkflowEngine
        if(statusOnly===true) {
            const result: GenDownloadsResponse = await getOpStatusForScene(idSystemObject);
            responses.push(result);
            messagePrefix = 'Gathering Download Status for: ';
        } else {
            /** TODO
             * - push to queue
             * - spin up queue worker (if not already)
             *      - if active list < threshold add new one to list
             *      - cycle through active items
             *          - if finished/error remove from list and store results (just return status obj)
             *          - if active list is empty then finish and return response
             */
            const result: GenDownloadsResponse = await createOpForScene(idSystemObject,LS.idUser);
            responses.push(result);
            messagePrefix = 'Generating Downloads for: ';
            // res.status(200).send(JSON.stringify(generateResponse(true,`Generating Downloads for: ${scene.Name}`, result.data))); //{ isValid, isJobRunning, idWorkflow, idWorkflowReport }
        }
    }

    // wait for all responses
    // responses = await processScenes(idSystemObjects, LS.idUser);

    // create our combined response and return
    res.status(200).send(JSON.stringify(buildOpResponse(`${messagePrefix}${responses.length} scenes`,responses)));
}

