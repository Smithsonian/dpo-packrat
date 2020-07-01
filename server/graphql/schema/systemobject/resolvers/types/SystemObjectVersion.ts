/**
 * Type resolver for SystemObjectVersion
 */
import { SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const SystemObjectVersion = {
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObject(prisma, idSystemObject);
    }
};

export default SystemObjectVersion;
