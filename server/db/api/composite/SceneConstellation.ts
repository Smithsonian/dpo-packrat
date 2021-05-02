import { Scene, Model, ModelSceneXref, Vocabulary } from '../..';

import * as H from '../../../utils/helpers';
import * as LOG from '../../../utils/logger';
import * as STORE from '../../../storage/interface';
import * as CACHE from '../../../cache';
import { IZip } from '../../../utils/IZip';
import { SvxReader } from '../../../utils/parser/svxReader';

export class SceneConstellation {
    Scene: Scene | null;
    ModelSceneXref: ModelSceneXref[] | null;

    private constructor(Scene: Scene, ModelSceneXref: ModelSceneXref[] | null) {
        this.Scene = Scene;
        this.ModelSceneXref = ModelSceneXref;
    }

    static async fetchFromScene(idScene: number): Promise<SceneConstellation | null> {
        const scene: Scene | null = await Scene.fetch(idScene);
        if (!scene) {
            LOG.error(`SceneConstellation.fetchFromScene(${idScene}) failed to retrieve Scene`, LOG.LS.eDB);
            return null;
        }
        const modelSceneXref: ModelSceneXref[] | null = await ModelSceneXref.fetchFromScene(idScene);
        if (!modelSceneXref) {
            LOG.error(`SceneConstellation.fetchFromScene(${idScene}) failed to retrieve ModelSceneXref`, LOG.LS.eDB);
            return null;
        }
        return new SceneConstellation(scene, modelSceneXref);
    }

    static async fetchFromAssetVersion(idAssetVersion: number): Promise<SceneConstellation | null> {
        let zip: IZip | null = null;
        try {
            // Attempt to read idAssetVersion from storage sytem
            let readStream: NodeJS.ReadableStream | null = null;
            const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersionByID(idAssetVersion);
            if (!RSR.success || !RSR.fileName || !RSR.readStream) {
                LOG.error(`SceneConstellation.fetchFromAssetVersion(${idAssetVersion}): ${RSR.error}`, LOG.LS.eDB);
                return null;
            }

            // if our asset is a zip, crack it, and use first .svx.json found as our scene
            if (RSR.fileName.toLowerCase().endsWith('.zip')) {
                const CAR: STORE.CrackAssetResult = await STORE.AssetStorageAdapter.crackAssetByAssetVersionID(idAssetVersion);
                if (!CAR.success || !CAR.zip) {
                    LOG.error(`SceneConstellation.fetchFromAssetVersion unable to crack zipfile ${RSR.fileName} for idAssetVersion ${idAssetVersion}: ${CAR.error}`, LOG.LS.eDB);
                    return null;
                }
                zip = CAR.zip;

                // TODO: handle bulk ingest of scenes, which may include multiple scene definitions!
                if (CAR.isBagit) {
                    LOG.error('SceneConstellation.fetchFromAssetVersion cracked zipfile ${RSR.fileName} for idAssetVersion ${idAssetVersion} and encountered unexpected Bagit file', LOG.LS.eDB);
                    return null;
                }

                const files: string[] = await zip.getJustFiles('.svx.json');
                if (files.length == 0) {
                    LOG.error(`SceneConstellation.fetchFromAssetVersion unable to locate scene file with .svx.json extension in zipfile ${RSR.fileName} for idAssetVersion ${idAssetVersion}`, LOG.LS.eDB);
                    return null;
                }

                readStream = await zip.streamContent(files[0]);
            } else
                readStream = RSR.readStream;

            if (!readStream) {
                LOG.error(`SceneConstellation.fetchFromAssetVersion unable to compute stream from ${RSR.fileName} for idAssetVersion ${idAssetVersion}`, LOG.LS.eDB);
                return null;
            }

            // Now that we have a stream, read & parse the scene file
            const svx: SvxReader = new SvxReader();
            const res: H.IOResults = await svx.loadFromStream(readStream);
            if (!res.success || !svx.SvxExtraction) {
                LOG.error(`SceneConstellation.fetchFromAssetVersion unable to read stream from ${RSR.fileName} for idAssetVersion ${idAssetVersion}: ${res.error}`, LOG.LS.eDB);
                return null;
            }

            const scene: Scene = new Scene({
                Name: '',
                idAssetThumbnail: null,
                IsOriented: false,
                HasBeenQCd: false,
                CountScene: svx.SvxExtraction.sceneCount,
                CountNode: svx.SvxExtraction.nodeCount,
                CountCamera: svx.SvxExtraction.cameraCount,
                CountLight: svx.SvxExtraction.lightCount,
                CountModel: svx.SvxExtraction.modelCount,
                CountMeta: svx.SvxExtraction.metaCount,
                CountSetup: svx.SvxExtraction.setupCount,
                CountTour: svx.SvxExtraction.tourCount,
                idScene: 0
            });

            let modelSceneXrefs: ModelSceneXref[] | null = null;
            if (svx.SvxExtraction.modelDetails) {
                modelSceneXrefs = [];
                const v1: Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eAssetAssetTypeModel);
                const v2: Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eAssetAssetTypeModelGeometryFile);
                const idVAssetType1: number | undefined = v1?.idVocabulary;
                const idVAssetType2: number | undefined = v2?.idVocabulary;
                if (!idVAssetType1 || !idVAssetType2) {
                    LOG.error(`SceneConstellation.fetchFromAssetVersion unable to lookup vocabulary for idAssetVersion ${idAssetVersion}: ${res.error}`, LOG.LS.eDB);
                    return null;
                }

                for (const MSX of svx.SvxExtraction.modelDetails) {
                    // if we have a zip, look for our model within that zip by name
                    if (zip) {
                        const files: string[] = await zip.getJustFiles(MSX.Name);
                        if (files.length == 1) {    // found it ... record it as not ingested (i.e. MSX.idModel === 0)
                            modelSceneXrefs.push(MSX);
                            continue;
                        }
                    }

                    // Otherwise, look for an existing, matching model using AssetVersion.FileName === MSX.Name, AssetVersion.StorageSize === MSX.FileSize,
                    // Asset.idVAssetType IN [Model, ModelGeometryFile]
                    const models: Model[] | null = (MSX.Name && MSX.FileSize) ?
                        await Model.fetchByFileNameSizeAndAssetType(MSX.Name, MSX.FileSize, [idVAssetType1, idVAssetType2]) : null;
                    if (models && models.length > 0)
                        MSX.idModel = models[0].idModel;
                    modelSceneXrefs.push(MSX);
                }
            }
            return new SceneConstellation(scene, modelSceneXrefs);
        } finally {
            if (zip)
                await zip.close();
        }
    }
}