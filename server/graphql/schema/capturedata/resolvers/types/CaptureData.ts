/**
 * Type resolver for CaptureData
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const CaptureData = {
    AssetThumbnail: async (parent: Parent): Promise<DBAPI.Asset | null> => {
        return await DBAPI.Asset.fetch(parent.idAssetThumbnail);
    },
    VCaptureMethod: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVCaptureMethod);
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
    CaptureDataFile: async (parent: Parent): Promise<DBAPI.CaptureDataFile[] | null> => {
        return await DBAPI.CaptureDataFile.fetchFromCaptureData(parent.idCaptureData);
    },
    CaptureDataGroup: async (parent: Parent): Promise<DBAPI.CaptureDataGroup[] | null> => {
        return await DBAPI.CaptureDataGroup.fetchFromXref(parent.idCaptureData);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromCaptureDataID(parent.idCaptureData);
    }
};

export default CaptureData;
