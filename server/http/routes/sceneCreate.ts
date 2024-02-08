import * as LOG from '../../utils/logger';
import * as DBAPI from '../../db';
import { Request, Response } from 'express';
// import Vocabulary from '../../graphql/schema/vocabulary/resolvers/types/Vocabulary';

type ModelResult = {
    model: DBAPI.Model | null;
    error?: string | undefined;
};

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
        if(await isMasterModel(model)===false)
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
        const sceneModel: DBAPI.Model | null = await getModelFromScene(scene.idScene);
        if(!sceneModel)
            return sendError(res, 400, `unable to find model attached to scene (idScene: ${idScene})`);

        // make sure we're a master model
        if(await isMasterModel(sceneModel)===false)
            return sendError(res, 400, `retrieved model is not a scene generating model (idScene: ${idScene} | idModel: ${sceneModel.idModel})`);

        // if we don't have a reference model yet, assign it
        if(!model)
            model = sceneModel;

        // push our scene into the array
        scenes.push(scene);
    } else {
        // if we have

    }

    /*
        - what parameters does recipe need to run
        - change params to reflect what is needed
    */

    // cycle through scenes
    const result: any = { success: true, reports: [], model: { id: model?.idModel, } };
    for(let i=0; i<scenes.length; i++) {
        // we have our scene generating model so now we run the si-voyager-scene recipe
        // create workflow, recipe, and start
        const idWorkflowReport = -1;
    }

    // return our results
    result = {
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

const getModelFromScene = async (idScene: number): Promise<ModelResult> => {

    const matches: DBAPI.Model[] | null = await DBAPI.Model.fetchChildrenModels(null, scene.idScene, null);
    matches && matches.length > 0 ? matches[0] : null;

    // grab our scene
    // const scene: DBAPI.Scene | null = DBAPI.Scene.fetch(idScene);
    // if(!scene)
    //     return { model: null, error: `unable to fetch by scene id (idScene: ${idScene})` };

    // get 'master' model from the scene
    // ...

    // make sure we're a master model
    // ...

    return { model: null, error: `getting model from scene id not yet supported (${idScene})` };
};

const isMasterModel = async (model: DBAPI.Model): Promise<boolean> => {
    // check if model purpose matches that of master
    if(!model || !model.idVPurpose) {
        LOG.error(`API.SceneCreate cannot verify scene generating model. (idModel: ${model?.idModel})`, LOG.LS.eHTTP);
        return false;
    }

    // grab the vocabulary object for this model
    const vPurpose: DBAPI.Vocabulary | null = await DBAPI.Vocabulary.fetch(model.idVPurpose);
    if(!vPurpose) {
        LOG.error(`API.SceneCreate cannot verify scene generating model. purpose not assigned. (idModel: ${model?.idModel})`, LOG.LS.eHTTP);
        return false;
    }

    // check to see if the term is 'Master'
    // FUTURE: change to be more flexible and support raw/presentation model labels
    if(vPurpose.Term.toLowerCase()!=='master') {
        LOG.error(`API.SceneCreate model is not a scene generating model. (idModel: ${model?.idModel} | purpose: ${vPurpose.Term})`, LOG.LS.eHTTP);
        return false;
    }

    return true;
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
}