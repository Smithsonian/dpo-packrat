import { GetUnitResult, GetUnitInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';

import { resolveUnitByID } from '../types/Unit';

type Args = { input: GetUnitInput };

export default async function getUnit(_: Parent, args: Args, context: Context): Promise<GetUnitResult> {
    const { input } = args;
    const { idUnit } = input;
    const { prisma } = context;

    const Unit = await resolveUnitByID(prisma, Number.parseInt(idUnit));

    if (Unit) {
        return { Unit };
    }

    return { Unit: null };
}
