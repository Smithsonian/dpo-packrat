import { GetUserResult, QueryGetUserArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getUser(_: Parent, args: QueryGetUserArgs): Promise<GetUserResult> {
    const { input } = args;
    const { idUser } = input;

    const User = await DBAPI.User.fetch(idUser);
    return { User };
}
