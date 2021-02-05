import { GetAllUsersResult, QueryGetUserArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getUser(_: Parent, args: QueryGetUserArgs): Promise<GetAllUsersResult> {
    const { input } = args;
    const { search, eStatus } = input;

    const Users = await DBAPI.User.fetchUserList(search, eStatus);
    return { Users };
}
