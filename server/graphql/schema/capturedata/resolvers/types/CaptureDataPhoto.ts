/**
 * Type resolver for CaptureDataPhoto
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const CaptureDataPhoto = {
    VCaptureDatasetType: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVCaptureDatasetType);
    },
    VItemPositionType: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVItemPositionType);
    },
    VFocusType: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVFocusType);
    },
    VLightSourceType: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVLightSourceType);
    },
    VBackgroundRemovalMethod: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVBackgroundRemovalMethod);
    },
    VClusterType: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVClusterType);
    }
};

export default CaptureDataPhoto;
