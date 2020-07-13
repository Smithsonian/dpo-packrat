/**
 * Type resolver for Identifier
 */
import { Vocabulary } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Identifier = {
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetch(parent.idSystemObject);
    },
    VIdentifierType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVIdentifierType } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVIdentifierType);
    }
};

export default Identifier;
