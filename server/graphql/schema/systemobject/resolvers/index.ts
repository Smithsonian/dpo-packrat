import SystemObject from './types/SystemObject';
import SystemObjectVersion from './types/SystemObjectVersion';
import Identifier from './types/Identifier';
import Metadata from './types/Metadata';
import getSystemObjectDetails from './queries/getSystemObjectDetails';
import getSourceObjectIdentifer from './queries/getSourceObjectIdentifer';
import getAssetDetailsForSystemObject from './queries/getAssetDetailsForSystemObject';
import getVersionsForAsset from './queries/getVersionsForAsset';
import getDetailsTabDataForObject from './queries/getDetailsTabDataForObject';
import getProjectList from './queries/getProjectList';
import updateObjectDetails from './mutations/updateObjectDetails';
import updateSourceObjects from './mutations/updateSourceObjects';
import updateDerivedObjects from './mutations/updateDerivedObjects';
import deleteObjectConnection from './mutations/deleteObjectConnection';
import deleteIdentifier from './mutations/deleteIdentifier';
import getSystemObjectVersionFromSystemObject from './queries/getSystemObjectVersionFromSystemObject';
import rollbackSystemObjectVersion from './mutations/rollbackSystemObjectVersion';

const resolvers = {
    Query: {
        getSystemObjectDetails,
        getSourceObjectIdentifer,
        getAssetDetailsForSystemObject,
        getVersionsForAsset,
        getDetailsTabDataForObject,
        getProjectList,
        getSystemObjectVersionFromSystemObject
    },
    Mutation: {
        updateObjectDetails,
        updateSourceObjects,
        updateDerivedObjects,
        deleteObjectConnection,
        deleteIdentifier,
        rollbackSystemObjectVersion
    },
    SystemObject,
    SystemObjectVersion,
    Identifier,
    Metadata
};

export default resolvers;
