import { GetUserResult, GetUserInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { fetchUser } from '../../../../../db';

type Args = { input: GetUserInput };

export default async function getUser(_: Parent, args: Args, context: Context): Promise<GetUserResult> {
    const { input } = args;
    const { idUser } = input;
    const { prisma } = context;

    const User = await fetchUser(prisma, Number.parseInt(idUser));

    return { User };
}
