/**
 * Type resolver for CaptureData
 */
import { CaptureData, Vocabulary, CaptureDataFile, CaptureDataGroup, Asset, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const CaptureData = {
    AssetThumbnail: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData } }).Asset();
    },
    VCaptureMethod: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData } }).Vocabulary_CaptureData_idVCaptureMethodToVocabulary();
    },
    VCaptureDatasetType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData } }).Vocabulary_CaptureData_idVCaptureDatasetTypeToVocabulary();
    },
    VItemPositionType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData } }).Vocabulary_CaptureData_idVItemPositionTypeToVocabulary();
    },
    VFocusType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData } }).Vocabulary_CaptureData_idVFocusTypeToVocabulary();
    },
    VLightSourceType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData } }).Vocabulary_CaptureData_idVLightSourceTypeToVocabulary();
    },
    VBackgroundRemovalMethod: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData } }).Vocabulary_CaptureData_idVBackgroundRemovalMethodToVocabulary();
    },
    VClusterType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData } }).Vocabulary_CaptureData_idVClusterTypeToVocabulary();
    },
    CaptureDataFile: async (parent: Parent, _: Args, context: Context): Promise<CaptureDataFile[] | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData } }).CaptureDataFile();
    },
    CaptureDataGroup: async (parent: Parent, _: Args, context: Context): Promise<CaptureDataGroup[] | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;
        return await DBAPI.fetchCaptureDataGroupFromXref(prisma, idCaptureData);
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData } }).SystemObject();
    }
};

export default CaptureData;
