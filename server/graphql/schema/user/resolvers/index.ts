import User from './types/User';
import UserPersonalizationSystemObject from './types/UserPersonalizationSystemObject';
import UserPersonalizationUrl from './types/UserPersonalizationUrl';
import getUser from './queries/getUser';
import getCurrentUser from './queries/getCurrentUser';
import createUser from './mutations/createUser';

const resolvers = {
    Query: {
        getUser,
        getCurrentUser
    },
    Mutation: {
        createUser
    },
    User,
    UserPersonalizationSystemObject,
    UserPersonalizationUrl
};

export default resolvers;
