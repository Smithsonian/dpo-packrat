/**
 * Type resolver for Identifier
 */
import { SystemObject, Vocabulary } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Identifier = {
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObject(prisma, idSystemObject);
    },
    VIdentifierType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVIdentifierType } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVIdentifierType);
    }
};

export default Identifier;
