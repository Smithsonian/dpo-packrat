/**
 * Type resolver for Unit
 */
import { Subject, Actor, Unit, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Unit = {
    Subject: async (parent: Parent, _: Args, context: Context): Promise<Subject[] | null> => {
        const { idUnit } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSubjectFromUnit(prisma, idUnit);
    },
    Actor: async (parent: Parent, _: Args, context: Context): Promise<Actor[] | null> => {
        const { idUnit } = parent;
        const { prisma } = context;

        return await DBAPI.fetchActorFromUnit(prisma, idUnit);
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idUnit } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObjectFromUnit(prisma, idUnit);
    }
};

export default Unit;
