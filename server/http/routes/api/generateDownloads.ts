/* eslint-disable @typescript-eslint/no-explicit-any */
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
// import * as COMMON from '@dpo-packrat/common';
// import { VocabularyCache } from '../../../cache';

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

    // get our method to see what we should do
    let statusOnly: boolean = true;
    switch(req.method.toLocaleLowerCase()) {
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
    if(idSystemObject === 0) {
        LOG.error(`API.generateDownloads failed. invalid id: ${idSystemObject}`,LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(false,`invalid id parameter: ${req.query.id ?? -1}`)));
        return;
    }

    // grab it and make sure it's a scene
    const scene: DBAPI.Scene | null = await DBAPI.Scene.fetchBySystemObject(idSystemObject);
    if(!scene) {
        LOG.error(`API.generateDownloads failed. cannot find Scene. (id:${idSystemObject})`,LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(false,`cannot find scene: ${idSystemObject}`)));
        return;
    }

    // see if scene is valid
    // TODO: add more checks to ensure it's safe to run generate downloads (e.g. master model good, names good, etc.)
    const isSceneValid: boolean = (scene.PosedAndQCd)?true:false; // doing this to unlocked from number
    if(isSceneValid === false) {
        LOG.error(`API.generateDownloads failed. scene is not QC'd. (id:${idSystemObject} | scene:${scene.idScene})`,LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(false,'scene has not be QC\'d.')));
        return;
    }

    // TODO: get our idJob from the vocabulary for COMMON.eVocabularyID.eJobJobTypeCookSIGenerateDownloads
    // FIX: vocabulary structure/enum is returning values different than what's in the db or undefined
    // const eVocabID: COMMON.eVocabularyID = (<any>COMMON.eVocabularyID)[COMMON.eVocabularyID.eJobJobTypeCookSIGenerateDownloads];
    // const vocabulary: DBAPI.Vocabulary | undefined = await VocabularyCache.vocabularyByEnum(eVocabID);
    // console.log(`vocabulary: ${eVocabID} | ${typeof(eVocabID)} | ${COMMON.eVocabularyID.eJobJobTypeCookSIGenerateDownloads} | ${typeof(COMMON.eVocabularyID.eJobJobTypeCookSIGenerateDownloads)}`);

    // const jobs: DBAPI.Job[] | null = await DBAPI.Job.fetchByType(vocabulary.idVocabulary);
    // if(!jobs) {
    //     LOG.error(`API.generateDownloads failed. unable to find Job of correct type. (type: ${COMMON.eVocabularyID[vocabulary.idVocabulary]})`,LOG.LS.eHTTP);
    //     res.status(400).send(JSON.stringify(generateResponse(false,'unable to find Job type')));
    //     return;
    // }

    // get any generate downloads workflows/jobs running
    // HACK: hardcoding the job id since vocabulary is returning different values for looking up the job
    //       enum should provide 149, but is returning 125. The actual idJob is 8 (see above)
    let isRunning: number = -1;
    const activeJobs: DBAPI.JobRun[] | null = await DBAPI.JobRun.fetchByJobFiltered(8,true);
    if(activeJobs && activeJobs.length > 0) {
        // see if it's ours and if so, throw response
        for(let i=0; i< activeJobs.length; i++){
            if(activeJobs[i].usesScene(scene.idScene)) {
                LOG.info(`API.generateDownloads found running job (${activeJobs[i].idJobRun}) for scene (${scene.idScene}).`,LOG.LS.eDEBUG);
                isRunning = activeJobs[i].idJobRun;
                break;
            }
        }
    }
    // #endregion

    // if we only want the status, we're finished and can return success
    if(statusOnly === true) {
        const message: string = (isRunning>0)?`Job already running (id: ${scene.idScene} | scene: ${scene.Name})`:`Job is not running but valid. (id: ${scene.idScene} | scene: ${scene.Name})`;
        LOG.info(`API.generateDownloads ${message}`,LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(true,message,{ idWorkflow: -1, isSceneValid, isRunning: (isRunning>0) })));
        return;
    }

    // return success
    res.status(200).send(JSON.stringify(generateResponse(true,`Generating Downloads for: ${scene.Name}`,{ idWorkflow: -1, isSceneValid, isRunning: (isRunning>0) })));
}