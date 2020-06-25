import Scene from './types/Scene';
import Actor from './types/Actor';
import IntermediaryFile from './types/IntermediaryFile';
import getScene from './queries/getScene';

const resolvers = {
    Query: {
        getScene
    },
    Scene,
    Actor,
    IntermediaryFile
};

export default resolvers;
