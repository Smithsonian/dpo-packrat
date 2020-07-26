/**
 * Type resolver for ModelUVMapChannel
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelUVMapChannel = {
    ModelUVMapFile: async (parent: Parent): Promise<DBAPI.ModelUVMapFile | null> => {
        return await DBAPI.ModelUVMapFile.fetch(parent.idModelUVMapFile);
    },
    VUVMapType: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVUVMapType);
    }
};

export default ModelUVMapChannel;
