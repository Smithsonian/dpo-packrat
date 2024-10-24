import SystemObject from './types/SystemObject';
import SystemObjectVersion from './types/SystemObjectVersion';
import Identifier from './types/Identifier';
import Metadata from './types/Metadata';
import getSystemObjectDetails from './queries/getSystemObjectDetails';
import getSourceObjectIdentifer from './queries/getSourceObjectIdentifer';
import getAssetDetailsForSystemObject from './queries/getAssetDetailsForSystemObject';
import getVoyagerParams from './queries/getVoyagerParams';
import getVersionsForAsset from './queries/getVersionsForAsset';
import getDetailsTabDataForObject from './queries/getDetailsTabDataForObject';
import getProjectList from './queries/getProjectList';
import getSubjectList from './queries/getSubjectList';
import updateObjectDetails from './mutations/updateObjectDetails';
import updateSourceObjects from './mutations/updateSourceObjects';
import updateDerivedObjects from './mutations/updateDerivedObjects';
import deleteObjectConnection from './mutations/deleteObjectConnection';
import deleteIdentifier from './mutations/deleteIdentifier';
import deleteMetadata from './mutations/deleteMetadata';
import rollbackSystemObjectVersion from './mutations/rollbackSystemObjectVersion';
import createSubjectWithIdentifiers from './mutations/createSubjectWithIdentifiers';
import publish from './mutations/publish';

const resolvers = {
    Query: {
        getSystemObjectDetails,
        getSourceObjectIdentifer,
        getAssetDetailsForSystemObject,
        getVoyagerParams,
        getVersionsForAsset,
        getDetailsTabDataForObject,
        getProjectList,
        getSubjectList
    },
    Mutation: {
        updateObjectDetails,
        updateSourceObjects,
        updateDerivedObjects,
        deleteObjectConnection,
        deleteIdentifier,
        deleteMetadata,
        rollbackSystemObjectVersion,
        createSubjectWithIdentifiers,
        publish
    },
    SystemObject,
    SystemObjectVersion,
    Identifier,
    Metadata
};

export default resolvers;
