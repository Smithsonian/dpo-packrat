import Model from './types/Model';
import ModelMaterial from './types/ModelMaterial';
import ModelMaterialChannel from './types/ModelMaterialChannel';
import ModelMaterialUVMap from './types/ModelMaterialUVMap';
import ModelObject from './types/ModelObject';
import ModelObjectModelMaterialXref from './types/ModelObjectModelMaterialXref';
import ModelProcessingAction from './types/ModelProcessingAction';
import ModelProcessingActionStep from './types/ModelProcessingActionStep';
import getModel from './queries/getModel';
import getModelConstellation from './queries/getModelConstellation';

const resolvers = {
    Query: {
        getModel,
        getModelConstellation,
    },
    Model,
    ModelMaterial,
    ModelMaterialChannel,
    ModelMaterialUVMap,
    ModelObject,
    ModelObjectModelMaterialXref,
    ModelProcessingAction,
    ModelProcessingActionStep,
};

export default resolvers;
