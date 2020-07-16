/**
 * Type resolver for ModelUVMapFile
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelUVMapFile = {
    Asset: async (parent: Parent): Promise<DBAPI.Asset | null> => {
        return await DBAPI.Asset.fetch(parent.idAsset);
    },
    ModelGeometryFile: async (parent: Parent): Promise<DBAPI.ModelGeometryFile | null> => {
        return await DBAPI.ModelGeometryFile.fetch(parent.idModelGeometryFile);
    },
    ModelUVMapChannel: async (parent: Parent): Promise<DBAPI.ModelUVMapChannel[] | null> => {
        return await DBAPI.ModelUVMapChannel.fetchFromModelUVMapFile(parent.idModelUVMapFile);
    }
};

export default ModelUVMapFile;
