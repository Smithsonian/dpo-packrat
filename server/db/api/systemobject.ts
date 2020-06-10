import { PrismaClient, unit } from '@prisma/client';
const prisma = new PrismaClient();

export async function createSystemObject(Unit: unit): Promise<unit> {
    const { Name, Abbreviation, ARKPrefix } = Unit;

    const createdUnit: unit = await prisma.unit.create({
        data: {
            Name,
            Abbreviation,
            ARKPrefix,
            systemobject: {
                create: { Retired: 0 },
            },
        },
    });

    return createdUnit;
}
