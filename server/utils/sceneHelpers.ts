import * as DBAPI from '../db';
import * as CACHE from '../cache';
import * as STORE from '../storage/interface';
import * as H from './helpers';
import * as LOG from './logger';
import { SvxReader } from './parser';

export class SceneHelpers {
    /** Returns true if the scene exists, has a scene asset, that scene asset has one or more thumbnails in metas -> images,
     * and each thumbnail exists for the current version of the scene; returns false otherwise,
     * and returns false if there's an error (in which case the error text is set also) */
    static async sceneCanBeQCd(idScene: number): Promise<H.IOResults> {
        const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(idScene);
        if (!scene)
            return SceneHelpers.recordError(`sceneCanBeQCd(${idScene}) unable to load Scene`);

        const sceneSO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetchFromSceneID(idScene);
        if (!sceneSO)
            return SceneHelpers.recordError(`sceneCanBeQCd(${idScene}) unable to load Scene SystemObject`);

        const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchLatestFromSystemObject(sceneSO.idSystemObject);
        if (!assetVersions)
            return SceneHelpers.recordError(`sceneCanBeQCd(${idScene}) unable to load Scene AssetVersions from idSystemObject ${sceneSO.idSystemObject}`);

        // build filename set, and find scene asset version
        const fileNameSet: Set<string> = new Set<string>(); // set of normalized asset version filenames
        let assetVersionScene: DBAPI.AssetVersion | null = null;
        for (const assetVersion of assetVersions) {
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
            if (!asset)
                return SceneHelpers.recordError(`sceneCanBeQCd(${idScene}) unable to load Asset with idAsset ${assetVersion.idAsset}`);

            // If we haven't yet identified a preferred assetDetail record, examine and compare this asset's asset type with the scene system object
            if (!assetVersionScene) {
                if (await CACHE.VocabularyCache.isPreferredAsset(asset.idVAssetType, sceneSO))
                    assetVersionScene = assetVersion;
            }

            fileNameSet.add(assetVersion.FileName.toLowerCase());
        }

        if (!assetVersionScene)
            return SceneHelpers.recordError(`sceneCanBeQCd(${idScene}) unable to locate asset version for scene svx.json`);

        const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersionByID(assetVersionScene.idAssetVersion);
        if (!RSR.success || !RSR.readStream)
            return SceneHelpers.recordError(`sceneCanBeQCd(${idScene}) unable to read scene asset ${assetVersionScene.idAssetVersion}: ${RSR.error}`);

        const svxReader: SvxReader = new SvxReader();
        const svxRes: H.IOResults = await svxReader.loadFromStream(RSR.readStream);
        if (!svxRes.success)
            return SceneHelpers.recordError(`sceneCanBeQCd(${idScene}) unable to read scene from asset ${assetVersionScene.idAssetVersion}: ${svxRes.error}`);

        if (!svxReader.SvxDocument || !svxReader.SvxDocument.metas)
            return { success: true };
        let hasImage: boolean = false;
        const missingImageSet: Set<string> = new Set<string>(); // set of metas -> images that are missing from our fileNameMap
        for (const meta of svxReader.SvxDocument.metas) {
            if (meta.images) {
                for (const image of meta.images) {
                    if (!fileNameSet.has(image.uri.toLowerCase()))
                        missingImageSet.add(image.uri);
                    else
                        hasImage = true;
                }
            }
        }

        if (!hasImage)
            return SceneHelpers.recordError(`sceneCanBeQCd(${idScene}) no thumbnails detected in scene`);

        if (missingImageSet.size === 0)
            return { success: true };
        let first: boolean = true;
        let missingFiles: string = '';
        for (const missing of missingImageSet) {
            if (first)
                first = false;
            else
                missingFiles += ', ';
            missingFiles += missing;
        }
        return SceneHelpers.recordError(`sceneCanBeQCd(${idScene}) missing thumbnails ${missingFiles}`);
    }

    private static recordError(error: string): H.IOResults {
        LOG.error(`SceneHelpers ${error}`, LOG.LS.eSYS);
        return { success: false, error };
    }
}