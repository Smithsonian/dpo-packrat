import SystemObject from './types/SystemObject';
import SystemObjectVersion from './types/SystemObjectVersion';
import Identifier from './types/Identifier';
import Metadata from './types/Metadata';
import getSystemObjectDetails from './queries/getSystemObjectDetails';
import getSourceObjectIdentifer from './queries/getSourceObjectIdentifer';
import getAssetDetailsForSystemObject from './queries/getAssetDetailsForSystemObject';
import getVersionsForSystemObject from './queries/getVersionsForSystemObject';
import getDetailsTabDataForObject from './queries/getDetailsTabDataForObject';
import getProjectList from './queries/getProjectList';
import updateObjectDetails from './mutations/updateObjectDetails';
import updateSourceObjects from './mutations/updateSourceObjects';
import updateDerivedObjects from './mutations/updateDerivedObjects';
import deleteObjectConnection from './mutations/deleteObjectConnection';

const resolvers = {
    Query: {
        getSystemObjectDetails,
        getSourceObjectIdentifer,
        getAssetDetailsForSystemObject,
        getVersionsForSystemObject,
        getDetailsTabDataForObject,
        getProjectList
    },
    Mutation: {
        updateObjectDetails,
        updateSourceObjects,
        updateDerivedObjects,
        deleteObjectConnection
    },
    SystemObject,
    SystemObjectVersion,
    Identifier,
    Metadata
};

export default resolvers;
