/**
 * Type resolver for ModelObject
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelObject = {
    Model: async (parent: Parent): Promise<DBAPI.Model | null> => {
        return await DBAPI.Model.fetch(parent.idModel);
    },
};

export default ModelObject;