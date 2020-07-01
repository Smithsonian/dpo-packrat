/**
 * Type resolver for AccessContext
 */
import { AccessContextObject, AccessPolicy } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const AccessContext = {
    AccessContextObject: async (parent: Parent, _: Args, context: Context): Promise<AccessContextObject[] | null> => {
        const { idAccessContext } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAccessContextObjectFromAccessContext(prisma, idAccessContext);
    },
    AccessPolicy: async (parent: Parent, _: Args, context: Context): Promise<AccessPolicy[] | null> => {
        const { idAccessContext } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAccessPolicyFromAccessContext(prisma, idAccessContext);
    }
};

export default AccessContext;
