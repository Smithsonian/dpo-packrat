import { GetUnitResult, GetUnitInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';

import { resolveUnitByID } from '../types/Unit';

type Args = { input: GetUnitInput };

export default async function getUnit(_: Parent, args: Args, context: Context): Promise<GetUnitResult> {
    const { input } = args;
    const { id } = input;
    const { prisma } = context;

    const unit = await resolveUnitByID(prisma, Number.parseInt(id));

    if (unit) {
        return { unit };
    }

    return { unit: null };
}
