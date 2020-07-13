/**
 * Type resolver for Unit
 */
import { Subject, Unit } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Unit = {
    Subject: async (parent: Parent, _: Args, context: Context): Promise<Subject[] | null> => {
        const { idUnit } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSubjectFromUnit(prisma, idUnit);
    },
    Actor: async (parent: Parent): Promise<DBAPI.Actor[] | null> => {
        return await DBAPI.Actor.fetchFromUnit(parent.idUnit);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromUnitID(parent.idUnit);
    }
};

export default Unit;
