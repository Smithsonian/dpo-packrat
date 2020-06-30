import Model from './types/Model';
import ModelGeometryFile from './types/ModelGeometryFile';
import ModelProcessingAction from './types/ModelProcessingAction';
import ModelProcessingActionStep from './types/ModelProcessingActionStep';
import ModelUVMapFile from './types/ModelUVMapFile';
import ModelUVMapChannel from './types/ModelUVMapChannel';
import getModel from './queries/getModel';
import createModel from './mutations/createModel';

const resolvers = {
    Query: {
        getModel
    },
    Mutation: {
        createModel
    },
    Model,
    ModelGeometryFile,
    ModelProcessingAction,
    ModelProcessingActionStep,
    ModelUVMapFile,
    ModelUVMapChannel
};

export default resolvers;
