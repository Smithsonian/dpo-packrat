import { GetUserResult, GetUserInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';

import { resolveUserByID } from '../types/User';

type Args = { input: GetUserInput };

export default async function getUser(_: Parent, args: Args, context: Context): Promise<GetUserResult> {
    const { input } = args;
    const { id } = input;
    const { prisma } = context;

    const user = await resolveUserByID(prisma, Number.parseInt(id));

    if (user) {
        return { user };
    }

    return { user: null };
}
