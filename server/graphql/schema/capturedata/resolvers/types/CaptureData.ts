/**
 * Type resolver for CaptureData
 */
import { CaptureData, Vocabulary, CaptureDataFile, Asset } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const CaptureData = {
    VCaptureMethod: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData: Number.parseInt(idCaptureData) } }).Vocabulary_CaptureData_idVCaptureMethodToVocabulary();
    },
    VCaptureDatasetType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData: Number.parseInt(idCaptureData) } }).Vocabulary_CaptureData_idVCaptureDatasetTypeToVocabulary();
    },
    VItemPositionType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData: Number.parseInt(idCaptureData) } }).Vocabulary_CaptureData_idVItemPositionTypeToVocabulary();
    },
    VFocusType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData: Number.parseInt(idCaptureData) } }).Vocabulary_CaptureData_idVFocusTypeToVocabulary();
    },
    VLightSourceType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData: Number.parseInt(idCaptureData) } }).Vocabulary_CaptureData_idVLightSourceTypeToVocabulary();
    },
    VBackgroundRemovalMethod: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData: Number.parseInt(idCaptureData) } }).Vocabulary_CaptureData_idVBackgroundRemovalMethodToVocabulary();
    },
    VClusterType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData: Number.parseInt(idCaptureData) } }).Vocabulary_CaptureData_idVClusterTypeToVocabulary();
    },
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData: Number.parseInt(idCaptureData) } }).Asset();
    },
    CaptureDataFile: async (parent: Parent, _: Args, context: Context): Promise<CaptureDataFile[] | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return prisma.captureData.findOne({ where: { idCaptureData: Number.parseInt(idCaptureData) } }).CaptureDataFile();
    }
};

export default CaptureData;
