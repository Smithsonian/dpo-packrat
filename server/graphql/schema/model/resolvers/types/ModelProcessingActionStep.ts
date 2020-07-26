/**
 * Type resolver for ModelProcessingActionStep
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelProcessingActionStep = {
    ModelProcessingAction: async (parent: Parent): Promise<DBAPI.ModelProcessingAction | null> => {
        return await DBAPI.ModelProcessingAction.fetch(parent.idModelProcessingAction);
    },
    VActionMethod: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVActionMethod);
    }
};

export default ModelProcessingActionStep;
