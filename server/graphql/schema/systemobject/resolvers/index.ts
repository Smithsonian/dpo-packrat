import SystemObject from './types/SystemObject';
import SystemObjectVersion from './types/SystemObjectVersion';
import Identifier from './types/Identifier';
import Metadata from './types/Metadata';
import getSystemObjectDetails from './queries/getSystemObjectDetails';
import getSourceObjectIdentifer from './queries/getSourceObjectIdentifer';

const resolvers = {
    Query: {
        getSystemObjectDetails,
        getSourceObjectIdentifer
    },
    SystemObject,
    SystemObjectVersion,
    Identifier,
    Metadata
};

export default resolvers;
