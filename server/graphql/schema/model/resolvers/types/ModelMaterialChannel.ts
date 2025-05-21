/**
 * Type resolver for ModelMaterialChannel
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

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
        // Look for extra data that has been stuffed in the parent by JobCookSIPackratInspect
        // DB IDs created by that method may be transient; if "Source" is defined, use it directly
        if (parent.Source && typeof (parent.Source) === 'string')
            return parent.Source;
        if (parent.idModelMaterialUVMap) {
            const uvMap: DBAPI.ModelMaterialUVMap | null = await DBAPI.ModelMaterialUVMap.fetch(parent.idModelMaterialUVMap);
            if (!uvMap) {
                RK.logError(RK.LogSection.eGQL,'material channel source failed','unable to load ModelMaterialUVMap from praent',{ parent },'GraphQL.Model.MaterialChannel');
                return null;
            }
            const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchLatestFromAsset(uvMap.idAsset);
            if (!assetVersion) {
                RK.logError(RK.LogSection.eGQL,'material channel source failed','unable to load ModelMaterialUVMap asset from parent',{ parent, uvMap },'GraphQL.Model.MaterialChannel');
                return null;
            }
            return assetVersion.FileName;
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
