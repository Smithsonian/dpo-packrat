/**
 * Type resolver for CaptureDataFile
 */
import { CaptureDataFile, CaptureData, Asset, Vocabulary } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const CaptureDataFile = {
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAsset(prisma, idAsset);
    },
    CaptureData: async (parent: Parent, _: Args, context: Context): Promise<CaptureData | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return await DBAPI.fetchCaptureData(prisma, idCaptureData);
    },
    Vocabulary: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVVariantType } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVVariantType);
    }
};

export default CaptureDataFile;
