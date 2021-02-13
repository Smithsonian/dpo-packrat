import User from './types/User';
import UserPersonalizationSystemObject from './types/UserPersonalizationSystemObject';
import UserPersonalizationUrl from './types/UserPersonalizationUrl';
import getUser from './queries/getUser';
import getAllUsers from './queries/getAllUsers';
import getCurrentUser from './queries/getCurrentUser';
import createUser from './mutations/createUser';


// TODO write mutation for editUser
const resolvers = {
    Query: {
        getUser,
        getCurrentUser,
        getAllUsers,
    },
    Mutation: {
        createUser
    },
    User,
    UserPersonalizationSystemObject,
    UserPersonalizationUrl
};

export default resolvers;
