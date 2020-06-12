import User from './types/User';
import getUser from './queries/getUser';

const resolvers = {
    Query: {
        getUser,
    },
    User
};

export default resolvers;