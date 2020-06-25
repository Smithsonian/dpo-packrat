/**
 * Type resolver for CaptureDataFile
 */
import { CaptureDataFile, CaptureData, Asset, Vocabulary } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const CaptureDataFile = {
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idCaptureDataFile } = parent;
        const { prisma } = context;

        return prisma.captureDataFile.findOne({ where: { idCaptureDataFile: Number.parseInt(idCaptureDataFile) } }).Asset();
    },
    CaptureData: async (parent: Parent, _: Args, context: Context): Promise<CaptureData | null> => {
        const { idCaptureDataFile } = parent;
        const { prisma } = context;

        return prisma.captureDataFile.findOne({ where: { idCaptureDataFile: Number.parseInt(idCaptureDataFile) } }).CaptureData();
    },
    Vocabulary: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureDataFile } = parent;
        const { prisma } = context;

        return prisma.captureDataFile.findOne({ where: { idCaptureDataFile: Number.parseInt(idCaptureDataFile) } }).Vocabulary();
    }
};

export default CaptureDataFile;
