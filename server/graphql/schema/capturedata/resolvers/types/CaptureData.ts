/**
 * Type resolver for CaptureData
 */
import { CaptureData, Vocabulary, CaptureDataFile, CaptureDataGroup, Asset, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const CaptureData = {
    AssetThumbnail: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idAssetThumbnail } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAsset(prisma, idAssetThumbnail);
    },
    VCaptureMethod: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVCaptureMethod } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVCaptureMethod);
    },
    VCaptureDatasetType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVCaptureDatasetType } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVCaptureDatasetType);
    },
    VItemPositionType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVItemPositionType } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVItemPositionType);
    },
    VFocusType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVFocusType } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVFocusType);
    },
    VLightSourceType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVLightSourceType } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVLightSourceType);
    },
    VBackgroundRemovalMethod: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVBackgroundRemovalMethod } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVBackgroundRemovalMethod);
    },
    VClusterType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVClusterType } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVClusterType);
    },
    CaptureDataFile: async (parent: Parent, _: Args, context: Context): Promise<CaptureDataFile[] | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return await DBAPI.fetchCaptureDataFileFromCaptureData(prisma, idCaptureData);
    },
    CaptureDataGroup: async (parent: Parent, _: Args, context: Context): Promise<CaptureDataGroup[] | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;
        return await DBAPI.fetchCaptureDataGroupFromXref(prisma, idCaptureData);
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObjectFromCaptureData(prisma, idCaptureData);
    }
};

export default CaptureData;
