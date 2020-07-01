/**
 * Type resolver for IntermediaryFile
 */
import { Asset, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const IntermediaryFile = {
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAsset(prisma, idAsset);
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idIntermediaryFile } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObjectFromIntermediaryFile(prisma, idIntermediaryFile);
    }
};

export default IntermediaryFile;
