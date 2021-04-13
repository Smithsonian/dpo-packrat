/**
 * Type resolver for ModelMaterialChannel
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import * as LOG from '../../../../../utils/logger';
import * as H from '../../../../../utils/helpers';

const ModelMaterialChannel = {
    ModelMaterial: async (parent: Parent): Promise<DBAPI.ModelMaterial | null> => {
        return await DBAPI.ModelMaterial.fetch(parent.idModelMaterial);
    },
    VMaterialType: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await CACHE.VocabularyCache.vocabulary(parent.idVMaterialType) || null;
    },
    ModelMaterialUVMap: async (parent: Parent): Promise<DBAPI.ModelMaterialUVMap | null> => {
        return await DBAPI.ModelMaterialUVMap.fetch(parent.idModelMaterialUVMap);
    },
    Type: async (parent: Parent): Promise<string | null> => {
        if (parent.idVMaterialType) {
            const vocab: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(parent.idVMaterialType);
            if (vocab)
                return vocab.Term;
        }
        return parent.MaterialTypeOther;
    },
    Source: async (parent: Parent): Promise<string | null> => {
        if (parent.idModelMaterialUVMap) {
            const uvMap: DBAPI.ModelMaterialUVMap | null = await DBAPI.ModelMaterialUVMap.fetch(parent.idModelMaterialUVMap);
            if (!uvMap) {
                LOG.logger.error(`ModelMaterialChannel.Source unable to load ModelMaterialUVMap from ${JSON.stringify(parent)}`);
                return null;
            }
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(uvMap.idAsset);
            if (!asset) {
                LOG.logger.error(`ModelMaterialChannel.Source unable to load ModelMaterialUVMap's asset from ${JSON.stringify(parent)} -> ${JSON.stringify(uvMap)}`);
                return null;
            }
            return asset.FileName;
        }
        return parent.UVMapEmbedded ? '(embedded)' : '';
    },
    Value: async (parent: Parent): Promise<string | null> => {
        const values: number[] = [];
        if (parent.Scalar1 != null) // checks for null and undefined
            values.push(parent.Scalar1);
        if (parent.Scalar2 != null) // checks for null and undefined
            values.push(parent.Scalar2);
        if (parent.Scalar3 != null) // checks for null and undefined
            values.push(parent.Scalar3);
        if (parent.Scalar4 != null) // checks for null and undefined
            values.push(parent.Scalar4);
        return values.join(', ');
    }
};

export default ModelMaterialChannel;
