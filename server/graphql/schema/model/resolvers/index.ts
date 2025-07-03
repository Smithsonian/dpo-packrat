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
    // Model: {
    //     Example resolver override for specific properties (e.g. ensure its not 'null')
    //     ModelUse(parent, _args, _context, _info) {
    //         // Dump the entire parent object so you can see its shape:
    //         console.log('🔥 ModelUse parent:', JSON.stringify(parent, null, 2));
    //         //—or, if you want full depth and no worries about cycles:—
    //         // console.log('🔥 ModelUse parent:', util.inspect(parent, { depth: null }));
    //         // Then return the value you actually want GraphQL to send back:
    //         return parent.ModelUse ?? '[]';
    //     }
    // },
};

export default resolvers;
