import { GetUserResult, GetUserInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';

import { resolveUserByID } from '../types/User';

type Args = { input: GetUserInput };

export default async function getUser(_: Parent, args: Args, context: Context): Promise<GetUserResult> {
    const { input } = args;
    const { idUser } = input;
    const { prisma } = context;

    const User = await resolveUserByID(prisma, Number.parseInt(idUser));

    if (User) {
        return { User };
    }

    return { User: null };
}
