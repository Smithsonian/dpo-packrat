import Model from './types/Model';
import ModelGeometryFile from './types/ModelGeometryFile';
import ModelProcessingAction from './types/ModelProcessingAction';
import ModelProcessingActionStep from './types/ModelProcessingActionStep';
import ModelUVMapFile from './types/ModelUVMapFile';
import ModelUVMapChannel from './types/ModelUVMapChannel';
import getModel from './queries/getModel';

const resolvers = {
    Query: {
        getModel
    },
    Model,
    ModelGeometryFile,
    ModelProcessingAction,
    ModelProcessingActionStep,
    ModelUVMapFile,
    ModelUVMapChannel
};

export default resolvers;
