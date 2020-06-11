import { PrismaClient, Unit } from '@prisma/client';
const prisma = new PrismaClient();

export async function createSystemObject(Unit: Unit): Promise<Unit> {
    const { Name, Abbreviation, ARKPrefix } = Unit;

    const createdUnit: Unit = await prisma.unit.create({
        data: {
            Name,
            Abbreviation,
            ARKPrefix,
            SystemObject: {
                create: { Retired: 0 },
            },
        },
    });

    return createdUnit;
}
