import AccessAction from './types/AccessAction';
import AccessContext from './types/AccessContext';
import AccessContextObject from './types/AccessContextObject';
import AccessPolicy from './types/AccessPolicy';
import AccessRole from './types/AccessRole';
import AccessRoleAccessActionXref from './types/AccessRoleAccessActionXref';
import getAccessPolicy from './queries/getAccessPolicy';

const resolvers = {
    Query: {
        getAccessPolicy
    },
    AccessAction,
    AccessContext,
    AccessContextObject,
    AccessPolicy,
    AccessRole,
    AccessRoleAccessActionXref
};

export default resolvers;
