/**
 * Type resolver for CaptureDataPhoto
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const CaptureDataPhoto = {
    CaptureData: async (parent: Parent): Promise<DBAPI.CaptureData | null> => {
        return await DBAPI.CaptureData.fetch(parent.idCaptureData);
    },
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
    },
    CaptureDatasetUse: async (parent: Parent): Promise<DBAPI.Vocabulary[] | null> => {
        return await DBAPI.Vocabulary.fetchFromVocabularySet(parent.idVocabularySet);
    }
};

export default CaptureDataPhoto;
