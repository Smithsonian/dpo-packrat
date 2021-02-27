/**
 * Type resolver for ModelObject
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelObject = {
    Model: async (parent: Parent): Promise<DBAPI.Model | null> => {
        return await DBAPI.Model.fetch(parent.idModel);
    },
    ModelMetrics: async (parent: Parent): Promise<DBAPI.ModelMetrics | null> => {
        return await DBAPI.ModelMetrics.fetch(parent.idModelMetrics);
    },
};

export default ModelObject;