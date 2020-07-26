/**
 * Type resolver for ModelGeometryFile
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelGeometryFile = {
    Asset: async (parent: Parent): Promise<DBAPI.Asset | null> => {
        return await DBAPI.Asset.fetch(parent.idAsset);
    },
    Model: async (parent: Parent): Promise<DBAPI.Model | null> => {
        return await DBAPI.Model.fetch(parent.idModel);
    },
    VModelFileType: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVModelFileType);
    },
    ModelUVMapFile: async (parent: Parent): Promise<DBAPI.ModelUVMapFile[] | null> => {
        return await DBAPI.ModelUVMapFile.fetchFromModelGeometryFile(parent.idModelGeometryFile);
    }
};

export default ModelGeometryFile;
