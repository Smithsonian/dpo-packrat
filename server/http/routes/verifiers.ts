/* eslint-disable @typescript-eslint/no-unused-vars */

import { Request, Response } from 'express';
import * as COL from '../../collections/interface/';
// import * as WF from '../../workflow/interface';
// import * as REP from '../../report/interface';
// import * as COMMON from '@dpo-packrat/common';
// import * as H from '../../utils/helpers';
import * as LOG from '../../utils/logger';
// import * as WFV from '../../workflow/impl/Packrat/WorkflowVerifier';
import * as DBAPI from '../../db';
// import { ASL, LocalStore } from '../../utils/localStore';
import { RouteBuilder, eHrefMode } from '../../http/routes/routeBuilder';
// import { VerifierEdan } from '../../utils/verifiers/VerifierEdan';
import * as V from '../../utils/verifiers';
import { Helpers } from '../../utils';
// import { eWorkflowJobRunStatus } from '@dpo-packrat/common';

export async function routeRequest(request: Request, response: Response): Promise<void> {
    const verifierToRun = request.params.id;

    // if nothing then complain
    if(verifierToRun===undefined) {
        LOG.error('HTTP request: incorrect usage of endpoint', LOG.LS.eHTTP);
        response.send('Request failed. Incorrect use of endpoint. Be sure to include which verifier to use.');
        return;
    }

    // handle the proper type
    switch(verifierToRun){
        case 'edan': {
            return await verifyEdanWorkflow(request,response);
        } break;

        case 'report': {
            return await getReport(request,response);
        } break;

        default: {
            LOG.error(`HTTP request: unsupported verify type (${verifierToRun})`, LOG.LS.eHTTP);
            response.send(`Request failed. Unsupported verify type/path (${verifierToRun})`);
        } break;
    }
}

// TODO: progressively build up report so that if requested before done it returns partial results
//       requires changing verifier to append after each subject, connecting tightly to workflow logic
async function verifyEdanWorkflow(req: Request, response: Response): Promise<void> {
    LOG.info('(Workflows) Verifying EDAN Records from endpoint...', LOG.LS.eGQL);

    // grab our config options from query params
    const verifierConfig: V.VerifierConfig = {
        collection: COL.CollectionFactory.getInstance(),
        detailedLogs: req.query.details==='true'?true:false,
        subjectLimit: (req.query.limit)?parseInt(req.query.limit as string):10000,
        systemObjectId: (req.query.objectId)?parseInt(req.query.objectId as string):-1
    };

    // console.time('start');
    const verifier: V.VerifierEdan = new V.VerifierEdan(verifierConfig);
    const result: V.VerifierResult = await verifier.init();
    if(result.success === false) {
        LOG.error('(EDAN Verifier) failed. '+result.error,LOG.LS.eHTTP);
        sendResponseMessage(response, result.success, result.error??'EDAN Verification (Failed)');
        return;
    }

    // fire off verify so it runs in the background
    verifier.verify();

    // extract our workflow
    const idWorkflow: number = result.data.idWorkflow;
    const idWorkflowReport: number = result.data.idWorkflowReport;
    const workflowReportUrl: string = result.data.workflowReportUrl;

    // wait briefly and if done then return the report
    // todo: handle option for allow partial return
    await Helpers.sleep(3000);
    if(verifier.isDone()===true)
        return sendResponseReport(response,idWorkflowReport,true);

    // if not done, send info back to client so they can keep trying through alt endpoint
    LOG.info(`verifier result: ${Helpers.JSONStringify({ idWorkflow,idWorkflowReport,workflowReportUrl })}`,LOG.LS.eAUDIT);
    sendResponseReport(response,idWorkflowReport,false);

    /*//---------------------------------------------
    // TESTING
    //---------------------------------------------
    // if not done, we're going to keep trying
    // placing functions inside loop to simulate external polling
    const timeout: number = Date.now() + 5000; // 5s in the future

    // loop until we're done. (simulates external polling)
        while(Date.now() <= timeout) {

        // get our step from the DB
        const workflowStep: DBAPI.WorkflowStep[] | null = await DBAPI.WorkflowStep.fetchFromWorkflow(idWorkflow);
        if(!workflowStep) {
            sendResponseMessage(response,false,'failed to get workflow step');
            return;
        }
        if(workflowStep.length<=0) {
            sendResponseMessage(response, false, 'no steps for given workflow');
            return;
        }
        LOG.info(`workflow step:\n ${Helpers.JSONStringify(workflowStep[0])}`,LOG.LS.eAUDIT);

        // see if we're done, dump the report and break.
        if(workflowStep[0].isDone())
            return sendResponseReport(response,idWorkflowReport,true);

        // otherwise, sleep for 3s and try again
        console.log('sleeping...');
        await Helpers.sleep(3000);
    }
    if(Date.now() > timeout) {
        const error = `(EDAN Verifier) Timed out (status: ${verifier.getStatus()}`;
        sendResponseMessage(response, false, error);
        return;
    }
    */

    // if not, we return info so the client can poll for it.
    // LOG.info(Helpers.JSONStringify(result),LOG.LS.eHTTP);
    // sendResponseMessage(response, result.success, Helpers.JSONStringify(result.data));

    // create our workflow (but don't start) and add it to the DB
    // const wfParams: WF.WorkflowParameters = {
    //     eWorkflowType: COMMON.eVocabularyID.eWorkflowTypeVerifier,
    //     //idSystemObject: undefined, // not operating on SystemObjects
    //     //idProject: TODO: populate with idProject
    //     idUserInitiator: idUser ?? undefined,   // not getting user at this point (but should when behind wall)
    //     autoStart: false, // don't start the workflow because we need to configure it
    //     parameters: {
    //         verifier: new V.VerifierEdan(verifierConfig)
    //     }
    // };
    // const workflow: WF.IWorkflow | null = await workflowEngine.create(wfParams);
    // if (!workflow) {
    //     const error: string = `unable to create EDAN Verifier workflow: ${H.Helpers.JSONStringify(wfParams)}`;
    //     sendResponseMessage(response,false,error);
    //     return;
    // }

    // LOG.info('creating workflow from route...',LOG.LS.eWF);
    // LOG.info(H.Helpers.JSONStringify(wfParams),LOG.LS.eWF);

    /*
    // grab our config options from query params
    const returnFile: boolean = req.query.returnFile==='true'?true:false;
    const detailedLogs: boolean = req.query.details==='true'?true:false;
    const subjectLimit: number = (req.query.limit)?parseInt(req.query.limit as string):10000;
    const systemObjectId: number = (req.query.objectId)?parseInt(req.query.objectId as string):-1;

    // cast it to our verifier type (TODO: catch fails) and configure
    const verifierWorkflow = workflow as WFV.WorkflowVerifier;
    verifierWorkflow.config = {
        collection: COL.CollectionFactory.getInstance(),
        detailedLogs,
        subjectLimit,
        systemObjectId
    };

    // start our workflow
    // TODO: check during execution for it timing out
    const workflowResult: H.IOResults = await verifierWorkflow.start();
    if(!workflowResult || workflowResult.success===false) {
        const error: string = 'EDAN Verifier workflow failed to start. '+workflowResult?.error;
        sendResponseMessage(response,false,error);
        return;
    }

    // get/create our report
    const iReport: REP.IReport | null = await REP.ReportFactory.getReport();
    if(!iReport) {
        const error: string = 'EDAN Verifier workflow failed to get report.';
        LOG.error(error, LOG.LS.eGQL);
        response.send('Verifing EDAN records FAILED!\n'+error);
        return;
    }

    // get the local store, our current report ID and fetch it
    // WHY: can the IReport higher up expose the id for fetch or grabbing the ID?
    // const LS: LocalStore = await ASL.getOrCreateStore();
    const idWorkflowReport: number | undefined = LS?.getWorkflowReportID();
    if (!idWorkflowReport) {
        const error: string = 'could not get workflow report ID';
        sendResponseMessage(response,false,error);
        return;
    }

    // get our report from the DB and configure
    const workflowReport = await DBAPI.WorkflowReport.fetch(idWorkflowReport);
    if (!workflowReport) {
        sendResponseMessage(response,false,`unable to fetch report with id ${idWorkflowReport}`);
        return;
    }

    // if we have CSV output add it to our report
    if(verifierWorkflow.result && verifierWorkflow.result.csvOutput) {

        // our desired filename
        const now: string = new Date().toISOString().split('T')[0];

        workflowReport.MimeType = 'text/csv';
        workflowReport.Data = verifierWorkflow.result.csvOutput;
        workflowReport.Name = 'EDANVerifier_Results_'+now;
        workflowReport.update();
    } else {
        const error: string = 'Error with verifier result';
        sendResponseMessage(response,false,`unable to fetch report with id ${idWorkflowReport}`);
        workflowReport.Data = error;
        workflowReport.update();
        return;
    }

    // if we return the file then do so, overwriting any message
    if(returnFile && verifierWorkflow.result.csvOutput!=undefined) {
        response.setHeader('Content-disposition', `attachment; filename=${workflowReport.Name}.csv`);
        response.set('Content-Type', 'text/csv');
        response.statusMessage = 'Verifying EDAN records SUCCEEDED!';
        response.status(200).send(verifierWorkflow.result.csvOutput);
        return;
    }

    // create our download URL for future use. (NOTE: using HTTP so localhost works)
    const workflowReportURL: string = RouteBuilder.DownloadWorkflowReport(idWorkflowReport,eHrefMode.ePrependServerURL); //`http://localhost:4000/download?idWorkflowReport=${idWorkflowReport}`;
    LOG.info(`EDAN verifier SUCCEEDED!! (${workflowReportURL})`,LOG.LS.eGQL);
    sendResponseMessage(response,true,getResponseMarkup(true,'Download Report',workflowReportURL));//`<a href="${workflowReportURL}">DOWNLOAD</a>`);
*/
    return;
}

async function getReport(request: Request, response: Response): Promise<void> {

    // GOTCHA: only checking for first report for a workflow id. should aggregate or identify based on last step

    let idWorkflow: number | undefined = (request.query.idWorkflow)?parseInt(request.query.idWorkflow as string):undefined;
    let idWorkflowReport: number | undefined = (request.query.idWorkflowReport)?parseInt(request.query.idWorkflowReport as string):undefined;

    // make sure we have the params we need
    if(!idWorkflow || !idWorkflowReport) {
        if(idWorkflow) {
            // we don't have the report id
            const workflowReport: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromWorkflow(idWorkflow);
            if(!workflowReport || workflowReport.length<=0)
                return sendResponseMessage(response,false,`(EDAN Verifier) cannot get report. no workflowReport (${Helpers.JSONStringify(idWorkflow)})`);
            idWorkflowReport = workflowReport[0].fetchID();
        } else if(idWorkflowReport) {
            // we don't have the workflow id
            const workflowReport: DBAPI.WorkflowReport | null = await DBAPI.WorkflowReport.fetch(idWorkflowReport);
            if(!workflowReport)
                return sendResponseMessage(response,false,`(EDAN Verifier) cannot get report. no workflowReport (${Helpers.JSONStringify(idWorkflowReport)})`);
            idWorkflow = workflowReport.idWorkflow;
        } else
            return sendResponseMessage(response,false,`(EDAN Verifier) cannot get report. invalid params. (${Helpers.JSONStringify(request.query)})`);
    }

    // report out
    LOG.info(`(EDAN Verifier) getting report for workflow ${idWorkflow}, from report id: ${idWorkflowReport}`,LOG.LS.eAUDIT);

    // get our step from the DB
    const workflowStep: DBAPI.WorkflowStep[] | null = await DBAPI.WorkflowStep.fetchFromWorkflow(idWorkflow);
    if(!workflowStep)
        return sendResponseMessage(response,false,'failed to get workflow step');
    if(workflowStep.length<=0)
        return sendResponseMessage(response, false, 'no steps for given workflow');

    // see if we're done, dump the report and break.
    if(workflowStep[0].isDone())
        return sendResponseReport(response,idWorkflowReport,true);

    // send message notifying user we're not done yet
    // todo: just return report in it's state, if not partial then just strip out data
    sendResponseMessage(response,true,'Report is not ready yet...');
    return;
}

async function sendResponseReport(response: Response, idWorkflowReport: number, isComplete: boolean, sendFile: boolean = false) {

    const workflowReport = await DBAPI.WorkflowReport.fetch(idWorkflowReport);
    if (!workflowReport) {
        sendResponseMessage(response,false,`unable to fetch report with id ${idWorkflowReport}`);
        return;
    }

    // build our response
    const workflowReportUrl: string = RouteBuilder.DownloadWorkflowReport(idWorkflowReport,eHrefMode.ePrependServerURL);
    const result = {
        isComplete,
        idWorkflowReport,
        workflowReportUrl,
        mimeType: workflowReport.MimeType,
        data: (isComplete)?workflowReport.Data:'pending...'
    };

    // if we need to send as text/csv file, do so
    // todo: add content type to report
    if(sendFile===false) {
        response.send(result);
    } else {
        response.setHeader('Content-disposition', `attachment; filename=${workflowReport.Name}.csv`);
        response.set('Content-Type', result.mimeType);
        response.statusMessage = 'Verifying EDAN records SUCCEEDED!';
        response.status(200).send(result.data);
    }
}
function sendResponseMessage(response: Response, success: boolean, message: string) {
    if(success) {
        LOG.info(`(EDAN Verifier) SUCCEEDED: ${message}`, LOG.LS.eGQL);
        response.send(message);
    } else {
        LOG.error(`(EDAN Verifier) FAILED: ${message}`, LOG.LS.eGQL);
        response.send(`Verifing EDAN records FAILED: ${message}`);
    }
}
/*
function getResponseMarkup(success: boolean, message?: string, url?: string): string {
    let output = '';
    output += '<div style="display: flex;align-items: center;flex-direction: column;margin-top:3rem;">';
    output += '<div style="width: 15rem;border-radius: 1rem;background-color: #0079C4;display: flex;flex-direction: column;">';
    output += '<img src="https://smithsonian.github.io/dpo-packrat/images/logo-name.png" style="width: 100%;object-fit: none;">';

    output += '<div style="border: 1px solid #0079c4;text-align: center;font-size: 1rem;background-color: white;border-radius: 0 0 1rem 1rem;border-top: 0px;">';
    if(success) {
        output += `<a href="${url}" style="color: #0079C4; font-weight: bold; text-decoration: none;">${message}</a>`;
    } else {
        output += '<span style="font-size:1.5rem; color:red;">ERROR</span>';
        output += `<p>${message}</p>`;
    }
    output += '</div>';

    output += '</div>';
    output += '</div>';
    return output;
}
*/