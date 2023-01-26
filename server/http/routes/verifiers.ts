import { Request, Response } from 'express';
// import * as NAV from '../../navigation/interface';
import * as COL from '../../collections/interface/';
import * as LOG from '../../utils/logger';
import * as V from '../../utils/verifiers/EdanVerifier';

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
            return await verifyEdan(request,response);
        } break;

        default: {
            LOG.error(`HTTP request: unsupported verify type (${verifierToRun})`, LOG.LS.eHTTP);
            response.send(`Request failed. Unsupported verify type/path (${verifierToRun})`);
        }
    }
}

// let edanVerifierLastRun: Date = new Date();
async function verifyEdan(_: Request, response: Response): Promise<void> {

    // nodemailer: attacch files?
    // watch timeout period and send email if approaching limit

    // create workflow report (is string, mimetype: txt/csv)
    // 1. create a new (verifier) workflow (+ vocabulary)
    // 2. workflowStep that knows how to run the edanVerifier
    // ref: workflow ingestion

    LOG.info('Verifying EDAN Records from endpoint...', LOG.LS.eHTTP);

    // get our query param on whether to return a CSV file
    const returnFile: boolean = (_.query.returnFile==='true')?true:false;
    const detailedLogs: boolean = (_.query.details==='true'?true:false);
    const subjectLimit: number = 1; // fix: (_.query.limit===undefined)?1:_.query.limit;
    const systemObjectId: number = -1; // todo

    const verifierConfig: V.EdanVerifierConfig = {
        collection: COL.CollectionFactory.getInstance(),
        subjectLimit,
        detailedLogs,
        systemObjectId,
        // writeToFile: '../../EDAN-Verifier_Output.csv'
    };
    const verifier: V.EdanVerifier = new V.EdanVerifier(verifierConfig);
    const result: V.EdanVerifierResult = await verifier.verify();
    if(result.success===true) {

        if(returnFile && result.csvOutput!=undefined) {
            const now: string = new Date().toISOString().split('T')[0];
            const filename: string = 'EDANVerifier_Results_'+now+'.csv';

            response.setHeader('Content-disposition', `attachment; filename=${filename}`);
            response.set('Content-Type', 'text/csv');
            response.statusMessage = 'Verifying EDAN records succeeded!';
            response.status(200).send(result.csvOutput);
        } else {
            response.send('Verifing EDAN records SUCCEEDED!');
        }
    } else {
        // TODO: log
        response.send('Verifing EDAN records FAILED! Check the logs...');
    }
}