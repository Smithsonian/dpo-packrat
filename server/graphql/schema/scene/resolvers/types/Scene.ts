/**
 * Type resolver for Scene
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Scene = {
    AssetThumbnail: async (parent: Parent): Promise<DBAPI.Asset | null> => {
        return await DBAPI.Asset.fetch(parent.idAssetThumbnail);
    },
    ModelSceneXref: async (parent: Parent): Promise<DBAPI.ModelSceneXref[] | null> => {
        return await DBAPI.ModelSceneXref.fetchFromScene(parent.idScene);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromSceneID(parent.idScene);
    }
};

export default Scene;
