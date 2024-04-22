/* eslint-disable @typescript-eslint/no-explicit-any */
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';

import { Request, Response } from 'express';

type GenDownloadsStatus = {
    idWorkflow?: number,        // do we have a workflow/report so we can (later) jump to its status page
    isSceneValid: boolean,      // if the referenced scene is QC'd and has basic requirements met
    isRunning: boolean,         // is there a job already running
    message?: string
};

type GenDownloadsResponse = {
    success: boolean,           // was the request successful
    message?: string,           // errors from the request|workflow to put in console or display to user
    data?: GenDownloadsStatus
};

const generateResponse = (success: boolean, message?: string | undefined, data?: any | undefined): GenDownloadsResponse => {
    return {
        success,
        message,
        data
    };
};

export async function generateDownloads(req: Request, res: Response): Promise<void> {
    LOG.info('Generating Downloads from API request...', LOG.LS.eHTTP);

    console.log(req.method);

    // get our method to see what we should do
    let statusOnly: boolean = true;
    switch(req.method) {
        case 'get': statusOnly = true; break;
        case 'post': statusOnly = false; break;
        default: {
            LOG.error('API.generateDownloads failed. unsupported HTTP method',LOG.LS.eHTTP);
            res.status(400).send(JSON.stringify(generateResponse(false,'invalid HTTP method')));
            return;
        }
    }

    // #region verify the status of the scene/workflow
    // extract query param for idSystemObject
    const idSystemObject: number = parseInt((req.query.id as string) ?? '0');
    console.log(idSystemObject);
    if(idSystemObject === 0) {
        LOG.error(`API.generateDownloads failed. invalid id: ${idSystemObject}`,LOG.LS.eHTTP);
        res.status(400).send(JSON.stringify(generateResponse(false,`invalid id parameter: ${req.query.id ?? -1}`)));
        return;
    }

    // grab it and make sure it's a scene
    const scene: DBAPI.Scene | null = await DBAPI.Scene.fetchBySystemObject(idSystemObject);
    console.log(scene);
    if(!scene) {
        LOG.error(`API.generateDownloads failed. cannot find Scene. (id:${idSystemObject})`,LOG.LS.eHTTP);
        res.status(400).send(JSON.stringify(generateResponse(false,`cannot find scene: ${idSystemObject}`)));
        return;
    }

    // see if scene is valid
    // TODO: add more checks to ensure it's safe to run generate downloads (e.g. master model good, names good, etc.)
    const isSceneValid: boolean = (scene.PosedAndQCd)?false:true;
    console.log(isSceneValid);
    if(isSceneValid === false) {
        LOG.error(`API.generateDownloads failed. scene is not QC'd. (id:${idSystemObject} | scene:${scene.idScene})`,LOG.LS.eHTTP);
        res.status(400).send(JSON.stringify(generateResponse(false,'scene has not be QC\'d.')));
        return;
    }

    // get any generate downloads workflows/jobs running
    // ... const activeJobs: DBAPI.JobRun[] = await DBAPI.JobRun.fetchByType('si-generate-downloads',true);

    // see if it's ours and if so, throw response
    const isRunning: boolean = false;
    // ...

    // #endregion

    // if we only want the status, we're finished and can return success
    if(statusOnly === true) {
        res.status(200).send(JSON.stringify(generateResponse(true,`Can generate downloads for: ${scene.Name}`,{ idWorkflow: -1, isSceneValid, isRunning })));
        return;
    }


    // return success
    res.status(200).send(JSON.stringify(generateResponse(true,`Generating Downloads for: ${scene.Name}`,{ idWorkflow: -1, isSceneValid, isRunning })));
}