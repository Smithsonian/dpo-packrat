import SystemObject from './types/SystemObject';
import SystemObjectVersion from './types/SystemObjectVersion';
import Identifier from './types/Identifier';
import Metadata from './types/Metadata';
import getSourceObjectIdentifer from './queries/getSourceObjectIdentifer';

const resolvers = {
    Query: {
        getSourceObjectIdentifer
    },
    SystemObject,
    SystemObjectVersion,
    Identifier,
    Metadata
};

export default resolvers;
