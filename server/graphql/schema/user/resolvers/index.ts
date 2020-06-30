import User from './types/User';
import UserPersonalizationSystemObject from './types/UserPersonalizationSystemObject';
import UserPersonalizationUrl from './types/UserPersonalizationUrl';
import getUser from './queries/getUser';
import createUser from './mutations/createUser';

const resolvers = {
    Query: {
        getUser
    },
    Mutation: {
        createUser
    },
    User,
    UserPersonalizationSystemObject,
    UserPersonalizationUrl
};

export default resolvers;
