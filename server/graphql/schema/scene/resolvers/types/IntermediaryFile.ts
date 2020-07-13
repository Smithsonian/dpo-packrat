/**
 * Type resolver for IntermediaryFile
 */
import { Asset } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const IntermediaryFile = {
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAsset(prisma, idAsset);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromIntermediaryFileID(parent.idIntermediaryFile);
    }
};

export default IntermediaryFile;
