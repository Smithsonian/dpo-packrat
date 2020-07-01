/**
 * Type resolver for Actor
 */
import { Unit, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Actor = {
    Unit: async (parent: Parent, _: Args, context: Context): Promise<Unit | null> => {
        const { idUnit } = parent;
        const { prisma } = context;

        return await DBAPI.fetchUnit(prisma, idUnit);
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idActor } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObjectFromActor(prisma, idActor);
    }
};

export default Actor;
