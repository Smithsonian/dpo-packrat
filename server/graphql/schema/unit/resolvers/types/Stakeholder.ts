/**
 * Type resolver for Stakeholder
 */
import { SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Stakeholder = {
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idStakeholder } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObjectFromStakeholder(prisma, idStakeholder);
    }
};

export default Stakeholder;
