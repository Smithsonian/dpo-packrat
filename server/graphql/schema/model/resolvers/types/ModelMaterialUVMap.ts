/**
 * Type resolver for ModelMaterialUVMap
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelMaterialUVMap = {
    Model: async (parent: Parent): Promise<DBAPI.Model | null> => {
        return await DBAPI.Model.fetch(parent.idModel);
    },
    Asset: async (parent: Parent): Promise<DBAPI.Asset | null> => {
        return await DBAPI.Asset.fetch(parent.idAsset);
    },
};

export default ModelMaterialUVMap;