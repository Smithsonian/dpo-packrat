import { GetUserResult } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getCurrentUser(_: Parent, __: never, context: Context): Promise<GetUserResult> {
    const { user, isAuthenticated } = context;
    if (!user || !isAuthenticated) {
        return { User: null };
    }

    const { idUser } = user;

    const User = await DBAPI.User.fetch(idUser);
    console.log('authenticated', isAuthenticated);
    console.log(User);
    return { User };
}
