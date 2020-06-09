import User from './types/user';
import getUser from './queries/getUser';

const resolvers = {
    Query: {
        getUser,
    },
    User
};

export default resolvers;