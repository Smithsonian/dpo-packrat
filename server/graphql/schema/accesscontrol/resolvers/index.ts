import AccessAction from './types/AccessAction';
import AccessContext from './types/AccessContext';
import AccessContextObject from './types/AccessContextObject';
import AccessPolicy from './types/AccessPolicy';
import AccessRole from './types/AccessRole';
import getAccessPolicy from './queries/getAccessPolicy';

const resolvers = {
    Query: {
        getAccessPolicy
    },
    AccessAction,
    AccessContext,
    AccessContextObject,
    AccessPolicy,
    AccessRole
};

export default resolvers;
