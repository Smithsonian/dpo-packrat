import { Asset, AssetVersion, Model, ModelObject, ModelObjectModelMaterialXref, ModelMaterial, ModelMaterialChannel, ModelMaterialUVMap, SystemObject, Vocabulary } from '../..';
import * as CACHE from '../../../cache';
import * as LOG from '../../../utils/logger';

export class ModelAsset {
    Asset: Asset;
    AssetVersion: AssetVersion;
    AssetName: string;
    AssetType: string;

    constructor(asset: Asset, assetVersion: AssetVersion, isModel: boolean, channelList: string[] | null) {
        this.Asset = asset;
        this.AssetVersion = assetVersion;
        this.AssetName = assetVersion.FileName;
        this.AssetType = (isModel) ? 'Model' : 'Texture Map' + (channelList ? ` ${channelList.sort().join(', ')}` : '');
    }

    static async fetch(assetVersion: AssetVersion): Promise<ModelAsset | null> {
        const asset: Asset | null = await Asset.fetch(assetVersion.idAsset); /* istanbul ignore next */
        if (!asset) {
            LOG.error(`ModelAsset.fetch(${JSON.stringify(assetVersion)}) failed`, LOG.LS.eDB);
            return null;
        }
        const uvMaps: ModelMaterialUVMap[] | null = await ModelMaterialUVMap.fetchFromAsset(assetVersion.idAsset);
        const isModel: boolean = (uvMaps === null || uvMaps.length === 0); // if we have no maps, then this asset is for the model/geometry
        const channelList: string[] = []; /* istanbul ignore else */
        if (uvMaps) {
            for (const uvMap of uvMaps) {
                const uvChannels: ModelMaterialChannel[] | null = await ModelMaterialChannel.fetchFromModelMaterialUVMap(uvMap.idModelMaterialUVMap); /* istanbul ignore else */
                if (uvChannels) {
                    for (const uvChannel of uvChannels) {
                        const VMaterialType: Vocabulary | undefined = uvChannel.idVMaterialType
                            ? await CACHE.VocabularyCache.vocabulary(uvChannel.idVMaterialType) : /* istanbul ignore next */ undefined;  /* istanbul ignore else */
                        if (VMaterialType)
                            channelList.push(VMaterialType.Term);
                        else if (uvChannel.MaterialTypeOther)
                            channelList.push(uvChannel.MaterialTypeOther);
                    }
                }
            }
        }

        return new ModelAsset(asset, assetVersion, isModel, channelList.length > 0 ? channelList : null);
    }
}

export class ModelConstellation {
    Model: Model;
    ModelObjects: ModelObject[] | null;
    ModelMaterials: ModelMaterial[] | null;
    ModelMaterialChannels: ModelMaterialChannel[] | null;
    ModelMaterialUVMaps: ModelMaterialUVMap[] | null;
    ModelObjectModelMaterialXref: ModelObjectModelMaterialXref[] | null;
    ModelAssets: ModelAsset[] | null;

    constructor(model: Model,
        modelObjects: ModelObject[] | null, modelMaterials: ModelMaterial[] | null,
        modelMaterialChannels: ModelMaterialChannel[] | null, modelMaterialUVMaps: ModelMaterialUVMap[] | null,
        modelObjectModelMaterialXref: ModelObjectModelMaterialXref[] | null, modelAsset: ModelAsset[] | null) {
        this.Model = model;
        this.ModelObjects = modelObjects;
        this.ModelMaterials = modelMaterials;
        this.ModelMaterialChannels = modelMaterialChannels;
        this.ModelMaterialUVMaps = modelMaterialUVMaps;
        this.ModelObjectModelMaterialXref = modelObjectModelMaterialXref;
        this.ModelAssets = modelAsset;
    }

    /** DELETES database records for ModelObjects, ModelMaterials, ModelMaterialChannels, ModelMaterialUVMaps, and ModelObjectModelMaterialXref.
     * This may be useful when called before persisting an updated ModelConstellation via JobCookSIPackratInspectOutput.persist()
     */
    async deleteSupportObjects(): Promise<boolean> {
        let retValue: boolean = true;

        if (this.ModelObjectModelMaterialXref) { // ModelObjectModelMaterialXref references ModelMaterial and ModelObject; delete these before those
            for (const modelObjectModelMaterialXref of this.ModelObjectModelMaterialXref)
                retValue = await modelObjectModelMaterialXref.delete() && retValue;
            this.ModelObjectModelMaterialXref = null;
        }
        if (this.ModelMaterialChannels) { // ModelMaterialChannel references ModelMaterialUVMap and ModelMaterial; delete these before those
            for (const modelMaterialChannel of this.ModelMaterialChannels)
                retValue = await modelMaterialChannel.delete() && retValue;
            this.ModelMaterialChannels = null;
        }
        if (this.ModelMaterialUVMaps) {
            for (const modelMaterialUVMap of this.ModelMaterialUVMaps)
                retValue = await modelMaterialUVMap.delete() && retValue;
            this.ModelMaterialUVMaps = null;
        }
        if (this.ModelMaterials) {
            for (const modelMaterial of this.ModelMaterials)
                retValue = await modelMaterial.delete() && retValue;
            this.ModelMaterials = null;
        }
        if (this.ModelObjects) {
            for (const modelObject of this.ModelObjects)
                retValue = await modelObject.delete() && retValue;
            this.ModelObjects = null;
        }
        return retValue;
    }

    static async fetch(idModel: number): Promise<ModelConstellation | null> {
        const model: Model | null = await Model.fetch(idModel);
        if (!model) {
            LOG.error(`ModelConstellation.fetch() unable to compute model from ${idModel}`, LOG.LS.eDB);
            return null;
        }

        const modelObjects: ModelObject[] | null = await ModelObject.fetchFromModel(idModel);
        const modelMaterials: ModelMaterial[] | null = await ModelMaterial.fetchFromModelObjects(modelObjects || /* istanbul ignore next */ []);
        const modelMaterialChannels: ModelMaterialChannel[] | null = await ModelMaterialChannel.fetchFromModelMaterials(modelMaterials || []);
        const modelMaterialUVMaps: ModelMaterialUVMap[] | null = await ModelMaterialUVMap.fetchFromModel(idModel);
        const modelObjectModelMaterialXref: ModelObjectModelMaterialXref[] | null = await ModelObjectModelMaterialXref.fetchFromModelObjects(modelObjects || /* istanbul ignore next */ []);

        const modelAssets: ModelAsset[] = [];
        const SO: SystemObject | null = await model.fetchSystemObject();
        const assetVersions: AssetVersion[] | null = SO ? await AssetVersion.fetchFromSystemObject(SO.idSystemObject) : /* istanbul ignore next */ null;
        if (assetVersions) {
            for (const assetVersion of assetVersions) {
                const modelAsset: ModelAsset | null = await ModelAsset.fetch(assetVersion); /* istanbul ignore else */
                if (modelAsset)
                    modelAssets.push(modelAsset);
            }
        }

        return new ModelConstellation(model, modelObjects, modelMaterials, modelMaterialChannels,
            modelMaterialUVMaps, modelObjectModelMaterialXref, modelAssets.length > 0 ? modelAssets : null);
    }

}
