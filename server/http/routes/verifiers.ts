/* eslint-disable @typescript-eslint/no-unused-vars */

import { Request, Response } from 'express';
import * as COL from '../../collections/interface/';
import * as LOG from '../../utils/logger';
import * as DBAPI from '../../db';
import { RouteBuilder, eHrefMode } from '../../http/routes/routeBuilder';
import * as V from '../../utils/verifiers';
import { Helpers } from '../../utils';

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
    LOG.info('Verifying EDAN Records from endpoint...', LOG.LS.eAUDIT);

    // grab our config options from query params
    const verifierConfig: V.VerifierConfig = {
        collection: COL.CollectionFactory.getInstance(),
        detailedLogs: req.query.details==='true'?true:false,
        subjectLimit: (req.query.limit)?parseInt(req.query.limit as string):10000,
        systemObjectId: (req.query.objectId)?parseInt(req.query.objectId as string):-1
    };

    // create our verifier and initialize (autostarts workflow)
    const verifier: V.VerifierEdan = new V.VerifierEdan(verifierConfig);
    const result: V.VerifierResult = await verifier.init();
    if(result.success === false) {
        LOG.error('(EDAN Verifier) failed. '+result.error,LOG.LS.eHTTP);
        return sendResponseMessage(response, result.success, result.error??'EDAN Verification (Failed)');
    }

    // fire off verify so it runs in the background as it may take awhile
    verifier.verify();

    // extract our ids and URL for the report
    const idWorkflow: number = result.data.idWorkflow;
    const idWorkflowReport: number = result.data.idWorkflowReport;
    const workflowReportUrl: string = result.data.workflowReportUrl;

    // wait briefly for it to finish. if done, then return the report
    // todo: handle option for allow partial return
    await Helpers.sleep(3000);
    if(verifier.isDone()===true)
        return sendResponseReport(response,idWorkflowReport,true);

    // if not done, send info back to client so they can keep trying through alt endpoint
    LOG.info(`verifier result: ${Helpers.JSONStringify({ idWorkflow,idWorkflowReport,workflowReportUrl })}`,LOG.LS.eAUDIT);
    return sendResponseReport(response,idWorkflowReport,false);
}

async function getReport(request: Request, response: Response): Promise<void> {

    // GOTCHA: only checking for first report for a workflow id. should aggregate or identify based on last step

    // grab our ids from query params
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
    LOG.info(`verifier getting report for workflow ${idWorkflow}, from report id: ${idWorkflowReport}`,LOG.LS.eAUDIT);

    // get our step from the DB
    const workflowStep: DBAPI.WorkflowStep[] | null = await DBAPI.WorkflowStep.fetchFromWorkflow(idWorkflow);
    if(!workflowStep)
        return sendResponseMessage(response,false,'failed to get workflow step');
    if(workflowStep.length<=0)
        return sendResponseMessage(response, false, 'no steps for given workflow');

    // see if we're done, dump the report and break.
    const allowPartial: boolean = (request.query.allowPartial==='true'?true:false)??false;
    return sendResponseReport(response,idWorkflowReport,workflowStep[0].isDone(),allowPartial);
}

async function sendResponseReport(response: Response, idWorkflowReport: number, isComplete: boolean, allowPartial: boolean = false, sendFile: boolean = false) {

    const workflowReport = await DBAPI.WorkflowReport.fetch(idWorkflowReport);
    if (!workflowReport)
        return sendResponseMessage(response,false,`unable to fetch report with id ${idWorkflowReport}`);

    // build our response
    const workflowReportUrl: string = RouteBuilder.DownloadWorkflowReport(idWorkflowReport,eHrefMode.ePrependServerURL);
    const result = {
        isComplete,
        idWorkflowReport,
        workflowReportUrl,
        mimeType: workflowReport.MimeType,
        data: (isComplete || allowPartial)?workflowReport.Data:'pending...'
    };

    // if we need to send as a text/csv file, do so
    if(sendFile===true) {

        // get our extension
        let extension: string;
        switch(result.mimeType) {
            case 'txt/csv': { extension = 'csv'; } break;
            case 'text/html': { extension = 'html'; } break;
            default: { extension = 'text'; }
        }

        // setup our headers and send it
        response.setHeader('Content-disposition', `attachment; filename=${workflowReport.Name}.${extension}`);
        response.set('Content-Type', result.mimeType);
        response.statusMessage = 'Verifying EDAN records SUCCEEDED!';
        response.status(200).send(result.data);
    } else {
        response.send(result);
    }
}
function sendResponseMessage(response: Response, success: boolean, message: string) {
    const result = {
        success,
        message
    };

    if(success) {
        LOG.info(`(Verifier) SUCCEEDED: ${message}`, LOG.LS.eAUDIT);
        response.send(result);
    } else {
        LOG.error(`(Verifier) FAILED: ${message}`, LOG.LS.eAUDIT);
        response.send(result);
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