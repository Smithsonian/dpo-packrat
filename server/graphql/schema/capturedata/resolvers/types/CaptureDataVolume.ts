/**
 * Type resolver for CaptureDataVolume
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const CaptureDataVolume = {
    CaptureData: async (parent: Parent): Promise<DBAPI.CaptureData | null> => {
        return await DBAPI.CaptureData.fetch(parent.idCaptureData);
    },
    VModality: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVModality);
    },
    VScanType: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVScanType);
    },
    VContentType: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVContentType);
    },
    VVoxelSizeUnit: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVVoxelSizeUnit);
    },
    VFilterLocation: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVFilterLocation);
    }
};

export default CaptureDataVolume;
