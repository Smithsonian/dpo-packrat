import User from './types/User';
import UserPersonalizationSystemObject from './types/UserPersonalizationSystemObject';
import UserPersonalizationUrl from './types/UserPersonalizationUrl';
import getUser from './queries/getUser';

const resolvers = {
    Query: {
        getUser
    },
    User,
    UserPersonalizationSystemObject,
    UserPersonalizationUrl
};

export default resolvers;
