/**
 * Type resolver for ModelProcessingAction
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelProcessingAction = {
    Actor: async (parent: Parent): Promise<DBAPI.Actor | null> => {
        return await DBAPI.Actor.fetch(parent.idActor);
    },
    Model: async (parent: Parent): Promise<DBAPI.Model | null> => {
        return await DBAPI.Model.fetch(parent.idModel);
    },
    ModelProcessingActionStep: async (parent: Parent): Promise<DBAPI.ModelProcessingActionStep[] | null> => {
        return await DBAPI.ModelProcessingActionStep.fetchFromModelProcessingAction(parent.idModelProcessingAction);
    }
};

export default ModelProcessingAction;
