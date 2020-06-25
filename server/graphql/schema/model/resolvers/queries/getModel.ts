import { GetModelResult, GetModelInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';

import { fetchModel } from '../../../../../db';

type Args = { input: GetModelInput };

export default async function getModel(_: Parent, args: Args, context: Context): Promise<GetModelResult> {
    const { input } = args;
    const { idModel } = input;
    const { prisma } = context;

    const Model = await fetchModel(prisma, Number.parseInt(idModel));

    if (Model) {
        return { Model };
    }

    return { Model: null };
}
