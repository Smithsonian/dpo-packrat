import Scene from './types/Scene';
import Actor from './types/Actor';
import IntermediaryFile from './types/IntermediaryFile';
import getScene from './queries/getScene';
import createScene from './mutations/createScene';

const resolvers = {
    Query: {
        getScene
    },
    Mutation: {
        createScene
    },
    Scene,
    Actor,
    IntermediaryFile
};

export default resolvers;
