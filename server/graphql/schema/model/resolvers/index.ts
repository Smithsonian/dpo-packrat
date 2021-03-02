import Model from './types/Model';
import ModelMaterial from './types/ModelMaterial';
import ModelMaterialChannel from './types/ModelMaterialChannel';
import ModelMaterialUVMap from './types/ModelMaterialUVMap';
import ModelObject from './types/ModelObject';
import ModelProcessingAction from './types/ModelProcessingAction';
import ModelProcessingActionStep from './types/ModelProcessingActionStep';
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
    ModelMaterial,
    ModelMaterialChannel,
    ModelMaterialUVMap,
    ModelObject,
    ModelProcessingAction,
    ModelProcessingActionStep,
};

export default resolvers;
