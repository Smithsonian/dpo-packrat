/**
 * Type resolver for CaptureDataGroup
 */
import { CaptureDataGroupCaptureDataXref } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const CaptureDataGroup = {
    CaptureDataGroupCaptureDataXref: async (parent: Parent, _: Args, context: Context): Promise<CaptureDataGroupCaptureDataXref[] | null> => {
        const { idCaptureDataGroup } = parent;
        const { prisma } = context;

        return prisma.captureDataGroup.findOne({ where: { idCaptureDataGroup } }).CaptureDataGroupCaptureDataXref();
    }
};

export default CaptureDataGroup;
