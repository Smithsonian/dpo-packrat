/* eslint-disable @typescript-eslint/no-unused-vars */

import { Request, Response } from 'express';
import * as COL from '../../collections/interface/';
import * as WF from '../../workflow/interface';
import * as REP from '../../report/interface';
import * as COMMON from '@dpo-packrat/common';
import * as H from '../../utils/helpers';
import * as LOG from '../../utils/logger';
import * as WFV from '../../workflow/impl/Packrat/WorkflowVerifier';
import * as DBAPI from '../../db';
import { ASL, LocalStore } from '../../utils/localStore';

export async function routeRequest(request: Request, response: Response): Promise<void> {

    const verifierToRun = request.params.id;
    console.warn(verifierToRun+'|'+JSON.stringify(request.params));

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

        default: {
            LOG.error(`HTTP request: unsupported verify type (${verifierToRun})`, LOG.LS.eHTTP);
            response.send(`Request failed. Unsupported verify type/path (${verifierToRun})`);
        }
    }
}

// TODO: progressively build up report so that if requested before done it returns partial results
//       requires changing verifier to append after each subject, connecting tightly to workflow logic
// TODO: fork verifier(s) so it does not use the same event loop as the main server improving performance
//       https://nodejs.org/api/child_process.html
// TODO: support server side events (SSE) to provide notifications to client on progress
async function verifyEdanWorkflow(req: Request, response: Response): Promise<void> {
    LOG.info('(Workflows) Verifying EDAN Records from endpoint...', LOG.LS.eGQL);

    const workflowEngine: WF.IWorkflowEngine | null = await WF.WorkflowFactory.getInstance();
    if (!workflowEngine) {
        const error: string = 'verifiers createWorkflow could not load WorkflowEngine';
        sendResponseMessage(response,false,error);
        return;
    }

    // create our workflow (but don't start) and add it to the DB
    const wfParams: WF.WorkflowParameters = {
        eWorkflowType: COMMON.eVocabularyID.eWorkflowTypeVerifier,
        //idSystemObject: undefined, // not operating on SystemObjects
        //idProject: TODO: populate with idProject
        //idUserInitiator: this.user?.idUser,   // not getting user at this point (but should when behind wall)
        autoStart: false // don't start the workflow because we need to configure it
    };
    const workflow: WF.IWorkflow | null = await workflowEngine.create(wfParams);
    if (!workflow) {
        const error: string = `unable to create EDAN Verifier workflow: ${H.Helpers.JSONStringify(wfParams)}`;
        sendResponseMessage(response,false,error);
        return;
    }

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
    const LS: LocalStore = await ASL.getOrCreateStore();
    const idWorkflowReport: number | undefined = LS.getWorkflowReportID();
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
    const workflowReportURL: string = `http://localhost:4000/download?idWorkflowReport=${idWorkflowReport}`;
    LOG.info(`EDAN verifier SUCCEEDED!! (${workflowReportURL})`,LOG.LS.eGQL);
    sendResponseMessage(response,true,getResponseMarkup(true,'Download Report',workflowReportURL));//`<a href="${workflowReportURL}">DOWNLOAD</a>`);

    return;
}

function sendResponseMessage(response: Response, success: boolean, message: string) {
    if(success) {
        LOG.info(`EDAN Verifier SUCCEEDED: ${message}`, LOG.LS.eGQL);
        response.send(message);
    } else {
        LOG.error(`EDAN Verifier FAILED: ${message}`, LOG.LS.eGQL);
        response.send(`Verifing EDAN records FAILED: ${message}`);
    }
}

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