import { GetUnitResult, GetUnitInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';

import { fetchUnit } from '../../../../../db';

type Args = { input: GetUnitInput };

export default async function getUnit(_: Parent, args: Args, context: Context): Promise<GetUnitResult> {
    const { input } = args;
    const { idUnit } = input;
    const { prisma } = context;

    const Unit = await fetchUnit(prisma, idUnit);

    return { Unit };
}
