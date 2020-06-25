/**
 * Type resolver for CaptureDataGroupCaptureDataXref
 */
import { CaptureData, CaptureDataGroup } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const CaptureDataGroupCaptureDataXref = {
    CaptureData: async (parent: Parent, _: Args, context: Context): Promise<CaptureData | null> => {
        const { idCaptureDataGroupCaptureDataXref } = parent;
        const { prisma } = context;

        return prisma.captureDataGroupCaptureDataXref.findOne({ where: { idCaptureDataGroupCaptureDataXref } }).CaptureData();
    },
    CaptureDataGroup: async (parent: Parent, _: Args, context: Context): Promise<CaptureDataGroup | null> => {
        const { idCaptureDataGroupCaptureDataXref } = parent;
        const { prisma } = context;

        return prisma.captureDataGroupCaptureDataXref
            .findOne({ where: { idCaptureDataGroupCaptureDataXref } })
            .CaptureDataGroup();
    }
};

export default CaptureDataGroupCaptureDataXref;
