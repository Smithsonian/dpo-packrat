import * as LOG from '../../utils/logger';
import * as DBAPI from '../../db';
import * as WF from '../../workflow/interface';
import { Request, Response } from 'express';

export async function sceneCreate(req: Request, res: Response): Promise<void> {

    // get our params
    const idModel: number | null = getQueryParam(req.query.idModel);
    const idScene: number | null = getQueryParam(req.query.idScene);
    if(!idModel && !idScene)
        return sendError(res, 400, `invalid parameters provided (idModel: ${idModel} | idScene: ${idScene})`);

    // grab our model attached to the passed in id. this is our reference scene
    // generating model.
    let model: DBAPI.Model | null = null;
    if(idModel) {
        // get our model from the DB
        model = await DBAPI.Model.fetch(idModel);
        if(!model)
            return sendError(res, 400, `unable to fetch model by id (idModel: ${idModel})`);

        // make sure we're a master model
        if(await model.matchesPurpose('Master') === false)
            return sendError(res, 400, `retrieved model is not a scene generating model (idModel: ${idModel})`);
    }

    // if we have a specific scene, then grab it and the associated model (if needed)
    const scenes: DBAPI.Scene[] = [];
    if(idScene) {
        // grab our scene
        const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(idScene);
        if(!scene)
            return sendError(res, 400, `unable to fetch by scene id (idScene: ${idScene})`);

        // get 'master' model from the scene
        // fetching the child models of the scene with MULL as the automationTag 'should' always return the master model
        const sceneModel: DBAPI.Model | null = await getMasterModelFromScene(scene.idScene);
        if(!sceneModel)
            return sendError(res, 400, `unable to find model attached to scene (idScene: ${idScene})`);

        // if we don't have a reference model yet, assign it
        if(!model)
            model = sceneModel;

        // push our scene into the array
        scenes.push(scene);
    }

    // Generate Scenes
    const workflowEngine: WF.IWorkflowEngine | null = await WF.WorkflowFactory.getInstance();
    if (!workflowEngine)
        return sendError(res, 400, `Unable to fetch workflow engine for download generation for scene ${idScene}`);

    // if we don't have our model, bail
    if(!model)
        return sendError(res, 400, `cannot create voyager scene. no valid 'master' model found. (idModel: ${idModel} | idScene: ${idScene})`);

    // trigger the workflow/recipe
    const workflow: WF.IWorkflow[] | null = await workflowEngine.generateVoyagerScene(model.idModel, { idUserInitiator: 1 }); // don't await // todo: idUser
    if(!workflow || workflow.length === 0)
        return sendError(res, 400, `cannot create voyager scene. workflow failed (idModel: ${idModel} | idScene: ${idScene})`);

    // TODO: get workflow report
    const idWorkflowReport = 1;

    // return our results
    const result = {
        success: true,
        report: {
            id: -1,
            url: `https://packrat.si.edu/server/download?idWorkflowReport=${idWorkflowReport}`,
        },
        model: {
            id: model.idModel,
            name: model.Name,
            title: model.Title,
        }
    };
    res.status(200).send(result);
}

const getMasterModelFromScene = async (idScene: number): Promise<DBAPI.Model | null> => {

    const matches: DBAPI.Model[] | null = await DBAPI.Model.fetchParentModel(idScene);
    if(!matches || matches.length === 0)
        return null;

    // get our vocabulary id for 'master' models
    const vPurposeMaster: DBAPI.Vocabulary | null = await DBAPI.Vocabulary.fetchFromTerm('Master');
    if(!vPurposeMaster) {
        LOG.error(`API.SceneCreate failed. no vocabulary for a master model. (idScene: ${idScene})`,LOG.LS.eHTTP);
        return null;
    }

    // get the model used for scene generation
    const models: DBAPI.Model[] | null = matches.filter(mdl => mdl.idVPurpose === vPurposeMaster.idVocabulary);
    if(!models || models.length != 1) {
        LOG.error(`API.SceneCreate failed. invalid models for scene generation. (models: ${models.length ?? -1})`,LOG.LS.eHTTP);
        return null;
    }

    return models[0];
};

const getQueryParam = (param): number | null => {
    if(!param)
        return null;

    try {
        return parseInt(param, 10);
    } catch(error) {
        LOG.error(`API.SceneCreate cannot get query param: ${error}`,LOG.LS.eHTTP);
        return null;
    }
};

const sendError = (res: Response, statusCode: number, message?: string | undefined) => {
    res.status(statusCode).send({ success: false, message });
    LOG.error(`API.SceneCreate failed: ${message}`, LOG.LS.eHTTP);
};