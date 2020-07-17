/**
 * Type resolver for IntermediaryFile
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const IntermediaryFile = {
    Asset: async (parent: Parent): Promise<DBAPI.Asset | null> => {
        return await DBAPI.Asset.fetch(parent.idAsset);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromIntermediaryFileID(parent.idIntermediaryFile);
    }
};

export default IntermediaryFile;
