/**
 * Type resolver for CaptureDataGroup
 */
import { CaptureData } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const CaptureDataGroup = {
    CaptureData: async (parent: Parent, _: Args, context: Context): Promise<CaptureData[] | null> => {
        const { idCaptureDataGroup } = parent;
        const { prisma } = context;

        return await DBAPI.fetchCaptureDataFromXref(prisma, idCaptureDataGroup);
    }
};

export default CaptureDataGroup;
