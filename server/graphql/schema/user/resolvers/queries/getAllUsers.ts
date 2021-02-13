import { GetAllUsersResult, QueryGetAllUsersArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getAllUsers(_: Parent, args: QueryGetAllUsersArgs): Promise<GetAllUsersResult> {
    const { input: {
        search,
        active
    } } = args;

    // Use the active from the QueryGetAllUsersArgs and link that to the DBAPI.eUserStatus enumberable to reference the same status

    const Users = await DBAPI.User.fetchUserList(search, DBAPI.eUserStatus[active]);
    if (!Users) {
        return {
            User: []
        };

    }
    return { User: Users };
    //note: check getCurrentUser for similar pattern
}
