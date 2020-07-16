import { GetUserResult, GetUserInput } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

type Args = { input: GetUserInput };

export default async function getUser(_: Parent, args: Args): Promise<GetUserResult> {
    const { input } = args;
    const { idUser } = input;

    const User = await DBAPI.User.fetch(idUser);
    return { User };
}
