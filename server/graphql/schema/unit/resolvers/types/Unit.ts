/**
 * Type resolver for Unit
 */
import { fetchSubjectForUnitID, fetchActorForUnitID, fetchUnit } from '../../../../../db';
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { Subject, Actor, Unit } from '../../../../../types/graphql';
import { parseSubjects } from './Subject';
import { parseActors } from '../../../scene/resolvers/types/Actor';

const Unit = {
    Subject: async (parent: Parent, _: Args, context: Context): Promise<Subject[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveSubjectByUnitID(prisma, Number.parseInt(id));
    },
    Actor: async (parent: Parent, _: Args, context: Context): Promise<Actor[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveActorByUnitID(prisma, Number.parseInt(id));
    }
};

export async function resolveUnitByID(prisma: PrismaClient, unitId: number): Promise<Unit | null> {
    const foundUnit = await fetchUnit(prisma, unitId);

    return parseUnit(foundUnit);
}

export function parseUnit(foundUnit: DB.Unit | null): Unit | null {
    let unit;
    if (foundUnit) {
        const { idUnit, Name, Abbreviation, ARKPrefix } = foundUnit;
        unit = {
            idUnit: String(idUnit),
            Name,
            Abbreviation,
            ARKPrefix
        };
    }

    return unit;
}

export async function resolveSubjectByUnitID(prisma: PrismaClient, unitId: number): Promise<Subject[] | null> {
    const foundSubjects = await fetchSubjectForUnitID(prisma, unitId);

    return parseSubjects(foundSubjects);
}

export async function resolveActorByUnitID(prisma: PrismaClient, unitId: number): Promise<Actor[] | null> {
    const foundActors = await fetchActorForUnitID(prisma, unitId);

    return parseActors(foundActors);
}

export default Unit;
