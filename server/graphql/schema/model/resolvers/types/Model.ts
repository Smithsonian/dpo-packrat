/**
 * Type resolver for Model
 */
import { Asset, Vocabulary, ModelGeometryFile, ModelProcessingAction, ModelSceneXref, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Model = {
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idModel } = parent;
        const { prisma } = context;

        return prisma.model.findOne({ where: { idModel } }).Asset();
    },
    VCreationMethod: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idModel } = parent;
        const { prisma } = context;

        return prisma.model.findOne({ where: { idModel } }).Vocabulary_Model_idVCreationMethodToVocabulary();
    },
    VModality: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idModel } = parent;
        const { prisma } = context;

        return prisma.model.findOne({ where: { idModel } }).Vocabulary_Model_idVModalityToVocabulary();
    },
    VPurpose: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idModel } = parent;
        const { prisma } = context;

        return prisma.model.findOne({ where: { idModel } }).Vocabulary_Model_idVPurposeToVocabulary();
    },
    VUnits: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idModel } = parent;
        const { prisma } = context;

        return prisma.model.findOne({ where: { idModel } }).Vocabulary_Model_idVUnitsToVocabulary();
    },
    ModelGeometryFile: async (parent: Parent, _: Args, context: Context): Promise<ModelGeometryFile[] | null> => {
        const { idModel } = parent;
        const { prisma } = context;

        return prisma.model.findOne({ where: { idModel } }).ModelGeometryFile();
    },
    ModelProcessingAction: async (parent: Parent, _: Args, context: Context): Promise<ModelProcessingAction[] | null> => {
        const { idModel } = parent;
        const { prisma } = context;

        return prisma.model.findOne({ where: { idModel } }).ModelProcessingAction();
    },
    ModelSceneXref: async (parent: Parent, _: Args, context: Context): Promise<ModelSceneXref[] | null> => {
        const { idModel } = parent;
        const { prisma } = context;

        return prisma.model.findOne({ where: { idModel } }).ModelSceneXref();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idModel } = parent;
        const { prisma } = context;

        return prisma.model.findOne({ where: { idModel } }).SystemObject();
    }
};

export default Model;
