import { PrismaClient, unit } from '@prisma/client'
const prisma = new PrismaClient();

export async function createSystemObject (Unit: unit) : Promise<unit>
{
    const createdUnit : unit = await prisma.unit.create({
        data: {
            Name:           Unit.Name,
            Abbreviation:   Unit.Abbreviation,
            ARKPrefix:      Unit.ARKPrefix,
            systemobject: {
                create: { Retired: 0 },
            },
        },
    });

    return new Promise<unit>((resolve) => { resolve(createdUnit); });
}
