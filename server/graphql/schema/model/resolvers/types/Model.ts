/**
 * Type resolver for Model
 */
import { Asset, Vocabulary, ModelGeometryFile, ModelProcessingAction, ModelSceneXref, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Model = {
    AssetThumbnail: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idAssetThumbnail } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAsset(prisma, idAssetThumbnail);
    },
    VCreationMethod: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVCreationMethod } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVCreationMethod);
    },
    VModality: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVModality } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVModality);
    },
    VPurpose: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVPurpose } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVPurpose);
    },
    VUnits: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVUnits } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVUnits);
    },
    ModelGeometryFile: async (parent: Parent, _: Args, context: Context): Promise<ModelGeometryFile[] | null> => {
        const { idModel } = parent;
        const { prisma } = context;

        return await DBAPI.fetchModelGeometryFileFromModel(prisma, idModel);
    },
    ModelProcessingAction: async (parent: Parent, _: Args, context: Context): Promise<ModelProcessingAction[] | null> => {
        const { idModel } = parent;
        const { prisma } = context;

        return await DBAPI.fetchModelProcessingActionFromModel(prisma, idModel);
    },
    ModelSceneXref: async (parent: Parent, _: Args, context: Context): Promise<ModelSceneXref[] | null> => {
        const { idModel } = parent;
        const { prisma } = context;
        // TODO: xref elimination
        return prisma.model.findOne({ where: { idModel } }).ModelSceneXref();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idModel } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObjectFromModel(prisma, idModel);
    }
};

export default Model;
