/**
 * Type resolver for Vocabulary
 */
import { Vocabulary, VocabularySet, CaptureDataFile, Identifier, Metadata, ModelGeometryFile, ModelProcessingActionStep, ModelUVMapChannel, WorkflowStep } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Vocabulary = {
    VocabularySet: async (parent: Parent, _: Args, context: Context): Promise<VocabularySet | null> => {
        const { idVocabulary } = parent;
        const { prisma } = context;

        return prisma.vocabulary.findOne({ where: { idVocabulary } }).VocabularySet();
    },
    CaptureDataFile: async (parent: Parent, _: Args, context: Context): Promise<CaptureDataFile[] | null> => {
        const { idVocabulary } = parent;
        const { prisma } = context;

        return prisma.vocabulary.findOne({ where: { idVocabulary } }).CaptureDataFile();
    },
    Identifier: async (parent: Parent, _: Args, context: Context): Promise<Identifier[] | null> => {
        const { idVocabulary } = parent;
        const { prisma } = context;

        return prisma.vocabulary.findOne({ where: { idVocabulary } }).Identifier();
    },
    Metadata: async (parent: Parent, _: Args, context: Context): Promise<Metadata[] | null> => {
        const { idVocabulary } = parent;
        const { prisma } = context;

        return prisma.vocabulary.findOne({ where: { idVocabulary } }).Metadata();
    },
    ModelGeometryFile: async (parent: Parent, _: Args, context: Context): Promise<ModelGeometryFile[] | null> => {
        const { idVocabulary } = parent;
        const { prisma } = context;

        return prisma.vocabulary.findOne({ where: { idVocabulary } }).ModelGeometryFile();
    },
    ModelProcessingActionStep: async (parent: Parent, _: Args, context: Context): Promise<ModelProcessingActionStep[] | null> => {
        const { idVocabulary } = parent;
        const { prisma } = context;

        return prisma.vocabulary.findOne({ where: { idVocabulary } }).ModelProcessingActionStep();
    },
    ModelUVMapChannel: async (parent: Parent, _: Args, context: Context): Promise<ModelUVMapChannel[] | null> => {
        const { idVocabulary } = parent;
        const { prisma } = context;

        return prisma.vocabulary.findOne({ where: { idVocabulary } }).ModelUVMapChannel();
    },
    WorkflowStep: async (parent: Parent, _: Args, context: Context): Promise<WorkflowStep[] | null> => {
        const { idVocabulary } = parent;
        const { prisma } = context;

        return prisma.vocabulary.findOne({ where: { idVocabulary } }).WorkflowStep();
    }
};

export default Vocabulary;
