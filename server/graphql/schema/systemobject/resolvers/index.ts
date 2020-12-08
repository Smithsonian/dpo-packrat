import SystemObject from './types/SystemObject';
import SystemObjectVersion from './types/SystemObjectVersion';
import Identifier from './types/Identifier';
import Metadata from './types/Metadata';
import getSystemObjectDetails from './queries/getSystemObjectDetails';
import getSourceObjectIdentifer from './queries/getSourceObjectIdentifer';
import getAssetDetailsForSystemObject from './queries/getAssetDetailsForSystemObject';
import getVersionsForSystemObject from './queries/getVersionsForSystemObject';

const resolvers = {
    Query: {
        getSystemObjectDetails,
        getSourceObjectIdentifer,
        getAssetDetailsForSystemObject,
        getVersionsForSystemObject
    },
    SystemObject,
    SystemObjectVersion,
    Identifier,
    Metadata
};

export default resolvers;
