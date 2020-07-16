/**
 * Type resolver for CaptureDataFile
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const CaptureDataFile = {
    Asset: async (parent: Parent): Promise<DBAPI.Asset | null> => {
        return await DBAPI.Asset.fetch(parent.idAsset);
    },
    CaptureData: async (parent: Parent): Promise<DBAPI.CaptureData | null> => {
        return await DBAPI.CaptureData.fetch(parent.idCaptureData);
    },
    VVariantType: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVVariantType);
    }
};

export default CaptureDataFile;
