import User from './types/User';
import UserPersonalizationSystemObject from './types/UserPersonalizationSystemObject';
import UserPersonalizationUrl from './types/UserPersonalizationUrl';
import getUser from './queries/getUser';
import getAllUsers from './queries/getAllUsers';
import getCurrentUser from './queries/getCurrentUser';
import createUser from './mutations/createUser';
import updateUser from './mutations/updateUser';


// TODO write mutation for updateUser
const resolvers = {
    Query: {
        getUser,
        getCurrentUser,
        getAllUsers,
    },
    Mutation: {
        createUser,
        updateUser
    },
    User,
    UserPersonalizationSystemObject,
    UserPersonalizationUrl
};

export default resolvers;
