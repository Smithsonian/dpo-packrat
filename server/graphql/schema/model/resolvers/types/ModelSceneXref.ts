/**
 * Type resolver for ModelSceneXref
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelSceneXref = {
    Model: async (parent: Parent): Promise<DBAPI.Model | null> => {
        return await DBAPI.Model.fetch(parent.idModel);
    },
    Scene: async (parent: Parent): Promise<DBAPI.Scene | null> => {
        return await DBAPI.Scene.fetch(parent.idScene);
    }
};

export default ModelSceneXref;
