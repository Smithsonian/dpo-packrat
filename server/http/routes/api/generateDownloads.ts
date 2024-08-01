/* eslint-disable @typescript-eslint/no-explicit-any */
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import * as COMMON from '../../../../common';
import * as COL from '../../../collections/interface';
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
    // LOG.info(`API.generateDownloads post creation. (result: ${H.Helpers.JSONStringify(result)})`,LOG.LS.eDEBUG);

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

const publishScene = async (response: GenDownloadsResponse): Promise<void> => {
    // CAUTION: this will likely continue running after the calling thread returns

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`<<< publishing scene: ${response.id}`);
    if(!response || !response.id || !response.state || !response.state.idWorkflow) {
        LOG.error(`API.Project.publishScene cannot publish scene. invalid inputs (${response.id} | ${response.state} | ${response.state?.idWorkflow}).`,LOG.LS.eDB);
        return;
    }

    // get our workflow
    const workflow: DBAPI.Workflow | null = await DBAPI.Workflow.fetch(response.state.idWorkflow);
    if(!workflow || !workflow.idWorkflowSet) {
        LOG.error('API.Project.publishScene cannot publish scene. no valid workflow(set) available.',LOG.LS.eDB);
        return;
    }

    // get our WorkflowSet status, which will bail on first error/cancel
    let wfSetState: H.IOStatus = await DBAPI.WorkflowSet.fetchStatus(workflow.idWorkflowSet);
    // console.log(`<<< state: ${COMMON.eWorkflowJobRunStatus[wfSetState.status]}`);

    // cycle through workflow until it's finished
    // TODO: master timeout so we're not trying forever
    // BUG: there can be a gap in time between one inspect ending and the next starting causing all 'known' workflows to be Done ending premature
    const iterationDelay: number = 10000; // TODO: 30s
    let isDone: boolean = false;
    while(isDone===false) {

        // get our WorkflowSet status, which will bail on first error/cancel
        wfSetState = await DBAPI.WorkflowSet.fetchStatus(workflow.idWorkflowSet);
        LOG.info(`API.GenerateDownloads.PublishScene waiting for ${response.id} to finish (${COMMON.eWorkflowJobRunStatus[wfSetState.status]})`,LOG.LS.eDEBUG);

        // see if we're done
        isDone = wfSetState.status===COMMON.eWorkflowJobRunStatus.eDone
            || wfSetState.status===COMMON.eWorkflowJobRunStatus.eCancelled
            || wfSetState.status===COMMON.eWorkflowJobRunStatus.eError;

        // inspections are triggered sequentially and sometimes there is a delay when one stops and the next fully starts
        // this can cause the 'known' list of steps to be all done and the loop can exit prematurely. we introduce an
        // arbitrary delay if isDone to try and catch this.
        if(isDone===true) {
            const preCount: number = wfSetState.data.length;
            await new Promise(resolve => setTimeout(resolve, 5000));
            wfSetState = await DBAPI.WorkflowSet.fetchStatus(workflow.idWorkflowSet);
            if(wfSetState.data.length != preCount)
                isDone = false;
            else
                break;
        }

        // wait for X ms before trying again
        await new Promise(resolve => setTimeout(resolve, iterationDelay));
    }

    // if we are finished, publish the scene, otherwise, handle the error/state
    if(wfSetState.status===COMMON.eWorkflowJobRunStatus.eDone) {
        LOG.info(`API.GenerateDownloads.PublishScene starting...(${H.Helpers.JSONStringify(wfSetState)})`,LOG.LS.eDEBUG);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // get published state and properties (SystemObjectVersion)
        const sceneSOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(response.id ?? -1);
        if(!sceneSOV) {
            LOG.error(`API.Project.publishScene failed to get SystemObjectVersion for scene ((${response.id ?? -1}))`,LOG.LS.eDB);
            return;
        }

        // get our collection and publish the id with the same state
        const ICol: COL.ICollection = COL.CollectionFactory.getInstance();
        const success: boolean = await ICol.publish(response.id, sceneSOV.PublishedState);
        if (success===false) {
            LOG.error(`API.Project.publishScene failed to publish (${response.id} | ${COMMON.ePublishedState[sceneSOV.PublishedState]})`,LOG.LS.eCOLL);
            return;
        }
    }

    // delay for 10s
    // await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('<<< finished publishing');
    return;
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
    let rePublish: boolean = false;
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
            rePublish = body.rePublish ?? false;
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

    // TEMP: limit IDs to a number that can be handled by Cook/Packrat
    const maxIDs: number = 10;
    if(idSystemObjects.length>maxIDs) {
        LOG.info('API.generateDownloads too many scenes submitted. limiting to 10',LOG.LS.eHTTP);
        idSystemObjects.splice(10);
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

            // if we want to republish the scene then we fire off the promise that checks the status
            // and when done re-publishes the scene (non-blocking)
            // (rePublish===true) &&
            publishScene(result);
        }
    }

    // create our combined response and return info to client
    res.status(200).send(JSON.stringify(buildOpResponse(`${messagePrefix}${responses.length} scenes`,responses)));
    LOG.info(`<<< post response (republish: ${rePublish})`,LOG.LS.eDEBUG);
}

