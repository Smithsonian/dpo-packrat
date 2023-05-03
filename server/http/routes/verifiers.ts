/* eslint-disable @typescript-eslint/no-unused-vars */

import { Request, Response } from 'express';
import * as COL from '../../collections/interface/';
import * as LOG from '../../utils/logger';
import * as DBAPI from '../../db';
import { RouteBuilder, eHrefMode } from '../../http/routes/routeBuilder';
import * as V from '../../utils/verifiers';
import { Helpers } from '../../utils';
import { deflateSync } from 'zlib';

export async function routeRequest(request: Request, response: Response): Promise<void> {
    const verifierToRun = request.params.id;

    // if nothing then complain
    if(verifierToRun===undefined) {
        LOG.error('HTTP request: incorrect usage of endpoint', LOG.LS.eAUDIT);
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
            LOG.error(`HTTP request: unsupported verify type (${verifierToRun})`, LOG.LS.eAUDIT);
            response.send(`Request failed. Unsupported verify type/path (${verifierToRun})`);
        } break;
    }
}

// verifies Packrat agains EDAN records. this routine is the launch point for the operation
// with subsequent polling through /verifier/report?... endpoint
async function verifyEdanWorkflow(req: Request, response: Response): Promise<void> {
    LOG.info('Verifying EDAN Records from endpoint...', LOG.LS.eAUDIT);

    // grab our config options from query params
    const verifierConfig: V.VerifierConfig = {
        collection: COL.CollectionFactory.getInstance(),
        detailedLogs: req.query.details==='true'?true:false,
        subjectLimit: (req.query.limit)?parseInt(req.query.limit as string):Number.MAX_SAFE_INTEGER,
        idSystemObject: (req.query.idSystemObject)?parseInt(req.query.idSystemObject as string):-1,
        allowPartial: (req.query.allowPartial==='true'?true:false)??false,
        forceUpdate: (req.query.forceUpdate==='true'?true:false)??false,
        // prefix: (req.query.logPrefix)?req.query.prefix as string:'VerifierEdan',
        writeToFile: (req.query.writeToFile)?req.query.limit as string:undefined,
        fixErrors: false,
    };

    console.log(verifierConfig);

    // if requesting a full report, see if we can return the daily report
    if((verifierConfig.subjectLimit && verifierConfig.subjectLimit==Number.MAX_SAFE_INTEGER) &&
        (verifierConfig.idSystemObject && verifierConfig.idSystemObject<=0) &&
        !verifierConfig.forceUpdate) {

        console.log('>>> running full report');

        // figure out our report name
        // const now: string = new Date().toISOString().split('T')[0];
        const reportName: string = `VerifierEdan_FullReport_${'2023-04-27'}`; //${now}`;

        // see if we have a report from today in the DB
        const existingReports: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromName(reportName);
        if(existingReports) {
            LOG.info(`VerifierEdan found ${existingReports.length} report(s) for: ${reportName}.`,LOG.LS.eAUDIT);
            let latestReport: DBAPI.WorkflowReport = existingReports[0];

            // if multiple returns grab the one with the highest index
            for(let i=1; i<existingReports.length; i++) {
                if(existingReports[i].idWorkflowReport>latestReport.idWorkflowReport)
                    latestReport = existingReports[i];
            }

            //  need to update ids based on the returned workflow
            return await sendResponseReport(response,latestReport,true);
        }
    }

    // create our verifier and initialize (autostarts workflow)
    const verifier: V.VerifierEdan = new V.VerifierEdan(verifierConfig);
    const result: V.VerifierResult = await verifier.init();
    if(result.success === false) {
        LOG.error(`${verifier.getVerifierPrefix()} failed.`+result.error,LOG.LS.eAUDIT);
        return sendResponseMessage(response, result.success, result.error??'EDAN Verification (Failed)');
    }

    // fire off verify so it runs in the background as it may take awhile
    verifier.verify();

    // extract our ids and URL for the report
    const idWorkflow: number = result.data.idWorkflow;
    const idWorkflowReport: number = result.data.idWorkflowReport;
    const workflowReportUrl: string = result.data.workflowReportUrl;
    LOG.info(`EDAN Verifier result: ${Helpers.JSONStringify({ idWorkflow,idWorkflowReport,workflowReportUrl })}`,LOG.LS.eAUDIT);

    // wait briefly for it to finish. if done, then return the report
    await Helpers.sleep(3000);

    // send info back to client so they can keep trying through alt endpoint if not done, otherwise send full report
    return sendResponseReportByID(response,idWorkflowReport,verifier.isDone(),verifierConfig.allowPartial);
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
                return sendResponseMessage(response,false,`verifier cannot get report. no workflowReport (${Helpers.JSONStringify(idWorkflow)})`);
            idWorkflowReport = workflowReport[0].fetchID();
        } else if(idWorkflowReport) {
            // we don't have the workflow id
            const workflowReport: DBAPI.WorkflowReport | null = await DBAPI.WorkflowReport.fetch(idWorkflowReport);
            if(!workflowReport)
                return sendResponseMessage(response,false,`verifier cannot get report. no workflowReport (${Helpers.JSONStringify(idWorkflowReport)})`);
            idWorkflow = workflowReport.idWorkflow;
        } else
            return sendResponseMessage(response,false,`verifier cannot get report. invalid params. (${Helpers.JSONStringify(request.query)})`);
    }

    // report out
    LOG.info(`verifier getting report for workflow ${idWorkflow}, from report id: ${idWorkflowReport}`,LOG.LS.eAUDIT);

    // get our step from the DB
    const workflowStep: DBAPI.WorkflowStep[] | null = await DBAPI.WorkflowStep.fetchFromWorkflow(idWorkflow);
    if(!workflowStep)
        return sendResponseMessage(response,false,`failed to get workflow step (id:${idWorkflowReport})`);
    if(workflowStep.length<=0)
        return sendResponseMessage(response, false, `no steps for given workflow (id:${idWorkflowReport})`);

    // see if we're done, dump the report and return
    const allowPartial: boolean = (request.query.allowPartial==='true'?true:false)??false;
    return sendResponseReportByID(response,idWorkflowReport,workflowStep[0].isDone(),allowPartial);
}

async function sendResponseReportByID(response: Response, idWorkflowReport: number, isComplete: boolean, allowPartial: boolean = false, sendFile: boolean = false) {

    const workflowReport = await DBAPI.WorkflowReport.fetch(idWorkflowReport);
    if (!workflowReport)
        return sendResponseMessage(response,false,`unable to fetch report with id ${idWorkflowReport}`);

    return await sendResponseReport(response,workflowReport,isComplete,allowPartial,sendFile);
}
async function sendResponseReport(response: Response, workflowReport: DBAPI.WorkflowReport, isComplete: boolean, allowPartial: boolean = false, sendFile: boolean = false) {
    // catch if workflow report is null
    if(!workflowReport)
        return sendResponseMessage(response,false,'Verifier failed to send report. workflowReport was null');

    // grab our id
    const idWorkflowReport: number = workflowReport.idWorkflowReport;

    // build our response
    const workflowReportUrl: string = RouteBuilder.DownloadWorkflowReport(idWorkflowReport,eHrefMode.ePrependServerURL);
    const result: V.VerifierReportResult = {
        success: true,
        isComplete,
        idWorkflowReport,
        workflowReportUrl,
        mimeType: workflowReport.MimeType,
        isCompressed: false,
        data: (isComplete || allowPartial)?workflowReport.Data:undefined,
    };

    // check data size and see if it should be compressed (100kb)
    if(result.data && result.data.length > 102400) {
        try {
            // compress our data and convert it to base64 for web safety
            const preSize: number = result.data.length;
            const buffer: Buffer = deflateSync(result.data);
            result.data = buffer.toString('base64');
            result.isCompressed = true;
            LOG.info(`Verifier compressed report. [${preSize} -> ${result.data.length}]`,LOG.LS.eAUDIT);
        } catch (err) {
            LOG.error(`Verifier couldn't compress data: ${(err instanceof Error)?err.message:'Unknown error type'}`,LOG.LS.eAUDIT);
        }
    }

    // if we need to send as a text/csv file, do so
    if(sendFile===true) {

        // get our extension
        let extension: string;
        switch(result.mimeType) {
            case 'txt/csv': { extension = 'csv'; } break;
            case 'text/html': { extension = 'html'; } break;
            case 'text/json': { extension = 'json'; } break;
            default: { extension = 'txt'; }
        }

        // setup our headers and send it
        response.setHeader('Content-disposition', `attachment; filename=${workflowReport.Name}.${extension}`);
        response.set('Content-Type', result.mimeType);
        response.statusMessage = 'Verifying SUCCEEDED!';
        response.status(200).send(result.data);
    } else {
        response.send(result);
    }
}
function sendResponseMessage(response: Response, success: boolean, message: string) {

    const result: V.VerifierReportResult = {
        success: true,
    };
    if(success===false)
        result.error = message;

    if(success) {
        LOG.info(`Verifier SUCCEEDED: ${message}`, LOG.LS.eAUDIT);
        response.send(result);
    } else {
        LOG.error(`Verifier FAILED: ${message}`, LOG.LS.eAUDIT);
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