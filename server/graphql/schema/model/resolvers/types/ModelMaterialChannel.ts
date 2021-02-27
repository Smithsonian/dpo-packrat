/**
 * Type resolver for ModelMaterialChannel
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelMaterialChannel = {
    ModelMaterial: async (parent: Parent): Promise<DBAPI.ModelMaterial | null> => {
        return await DBAPI.ModelMaterial.fetch(parent.idModelMaterial);
    },
    VMaterialType: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVMaterialType);
    },
    ModelMaterialUVMap: async (parent: Parent): Promise<DBAPI.ModelMaterialUVMap | null> => {
        return await DBAPI.ModelMaterialUVMap.fetch(parent.idModelMaterialUVMap);
    },
};

export default ModelMaterialChannel;
