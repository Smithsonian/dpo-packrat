import Scene from './types/Scene';
import Actor from './types/Actor';
import IntermediaryFile from './types/IntermediaryFile';
import getScene from './queries/getScene';
import getIntermediaryFile from './queries/getIntermediaryFile';

const resolvers = {
    Query: {
        getScene,
        getIntermediaryFile
    },
    Scene,
    Actor,
    IntermediaryFile
};

export default resolvers;
