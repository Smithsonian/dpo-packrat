/**
 * Type resolver for ModelMaterial
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelMaterial = {
    ModelObject: async (parent: Parent): Promise<DBAPI.ModelObject | null> => {
        return await DBAPI.ModelObject.fetch(parent.idModelObject);
    }
};

export default ModelMaterial;
