/**
 * Type resolver for ModelMaterial
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelMaterial = {
    ModelMaterialChannel: async (parent: Parent): Promise<DBAPI.ModelMaterialChannel[] | null> => {
        return await DBAPI.ModelMaterialChannel.fetchFromModelMaterial(parent.idModelMaterial);
    }
};

export default ModelMaterial;
