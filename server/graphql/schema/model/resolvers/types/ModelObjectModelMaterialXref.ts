/**
 * Type resolver for ModelObjectModelMaterialXref
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelObjectModelMaterialXref = {
    ModelObject: async (parent: Parent): Promise<DBAPI.ModelObject | null> => {
        return await DBAPI.ModelObject.fetch(parent.idModelObject);
    },
    ModelMaterial: async (parent: Parent): Promise<DBAPI.ModelMaterial | null> => {
        return await DBAPI.ModelMaterial.fetch(parent.idModelMaterial);
    },
};

export default ModelObjectModelMaterialXref;