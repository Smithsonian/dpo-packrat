import { Scene, Model, ModelSceneXref, AssetVersion, Vocabulary, SystemObjectInfo } from '../..';
import * as H from '../../../utils/helpers';
import * as LOG from '../../../utils/logger';
import * as STORE from '../../../storage/interface';
import * as CACHE from '../../../cache';
import * as COMMON from '@dpo-packrat/common';
import { IZip } from '../../../utils/IZip';
import { SvxReader, SvxNonModelAsset } from '../../../utils/parser/svxReader';
import * as path from 'path';

export class SceneConstellation {
    Scene: Scene | null;
    ModelSceneXref: ModelSceneXref[] | null;
    SvxNonModelAssets: SvxNonModelAsset[] | null;

    private static vocabAssetTypeModel: Vocabulary | undefined = undefined;
    private static vocabAssetTypeModelGeometryFile: Vocabulary | undefined = undefined;

    private constructor(Scene: Scene, ModelSceneXref: ModelSceneXref[] | null, SvxNonModelAssets: SvxNonModelAsset[] | null) {
        this.Scene = Scene;
        this.ModelSceneXref = ModelSceneXref;
        this.SvxNonModelAssets = SvxNonModelAssets;
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

        const handledAssetSet: Set<string> = new Set<string>();
        for (const MSX of modelSceneXref) {
            if (MSX.Name)
                handledAssetSet.add(MSX.Name?.toLowerCase());
        }

        // Compute non Model Assets
        let SvxNonModelAssets: SvxNonModelAsset[] | null = null;

        const sOI: SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromScene(scene);
        if (sOI)
            SvxNonModelAssets = await SceneConstellation.computeNonModelAssets(sOI.idSystemObject, handledAssetSet);
        else
            LOG.error(`SceneConstellation.fetchFromScene(${idScene}) failed to compute scene's idSystemObject`, LOG.LS.eDB);

        return new SceneConstellation(scene, modelSceneXref, SvxNonModelAssets);
    }

    private static async computeNonModelAssets(idSystemObject: number, handledAssetSet?: Set<string> | undefined): Promise<SvxNonModelAsset[] | null> {
        const assetVersions: AssetVersion[] | null = await AssetVersion.fetchLatestFromSystemObject(idSystemObject);
        if (!assetVersions) {
            LOG.error(`SceneConstellation.computeNonModelAssets(${idSystemObject}) failed to compute scene's asset versions`, LOG.LS.eDB);
            return null;
        }

        if (!handledAssetSet)
            handledAssetSet = new Set<string>();

        const SvxNonModelAssets: SvxNonModelAsset[] = [];
        for (const assetVersion of assetVersions) {
            const normalizedName: string = assetVersion.FileName.toLowerCase();
            if (handledAssetSet.has(normalizedName))
                continue;

            handledAssetSet.add(normalizedName);

            let type: string | null = null;
            const extension: string = path.extname(assetVersion.FileName).toLowerCase() || assetVersion.FileName.toLowerCase();
            switch (extension) {
                case '.jpg':
                case '.jpeg':
                    type = 'Image';
                    break;

                case '.html':
                case '.htm':
                    type = 'Article';
                    break;
            }

            if (type)
                SvxNonModelAssets.push({ uri: (assetVersion.FilePath ? assetVersion.FilePath + '/' : '') + assetVersion.FileName, type, idAssetVersion: assetVersion.idAssetVersion });
        }
        return SvxNonModelAssets;
    }

    static async fetchFromAssetVersion(idAssetVersion: number, directory?: string | undefined, idScene?: number | undefined): Promise<SceneConstellation | null> {
        LOG.info(`SceneConstellation.fetchFromAssetVersion(${idAssetVersion}, ${directory})`, LOG.LS.eDB);
        let zip: IZip | null = null;
        let isBagit: boolean = false;
        try {
            // Attempt to read idAssetVersion from storage sytem
            let readStream: NodeJS.ReadableStream | null = null;
            const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersionByID(idAssetVersion);
            if (!RSR.success || !RSR.fileName || !RSR.readStream) {
                LOG.error(`SceneConstellation.fetchFromAssetVersion(${idAssetVersion}, ${directory}): ${RSR.error}`, LOG.LS.eDB);
                return null;
            }

            // if our asset is a zip, crack it, and use first .svx.json found as our scene
            let fileName: string = RSR.fileName;
            if (RSR.fileName.toLowerCase().endsWith('.zip')) {
                const CAR: STORE.CrackAssetResult = await STORE.AssetStorageAdapter.crackAssetByAssetVersionID(idAssetVersion);
                if (!CAR.success || !CAR.zip) {
                    LOG.error(`SceneConstellation.fetchFromAssetVersion unable to crack zipfile ${RSR.fileName} for idAssetVersion ${idAssetVersion}: ${CAR.error}`, LOG.LS.eDB);
                    return null;
                }
                zip = CAR.zip;
                isBagit = CAR.isBagit;

                const files: string[] = await SceneConstellation.fetchFileFromZip(zip, isBagit, '.svx.json', directory) ?? [];
                if (files.length === 0) {
                    LOG.error(`SceneConstellation.fetchFromAssetVersion unable to locate scene file with .svx.json extension in zipfile ${RSR.fileName} for idAssetVersion ${idAssetVersion}`, LOG.LS.eDB);
                    return null;
                } else
                    LOG.info(`SceneConstellation.fetchFromAssetVersion found scene json in ${JSON.stringify(files)}`, LOG.LS.eDB);

                fileName += `/${files[0]}`;
                readStream = await zip.streamContent(files[0]);
            } else
                readStream = RSR.readStream;

            if (!readStream) {
                LOG.error(`SceneConstellation.fetchFromAssetVersion unable to compute stream from ${fileName} for idAssetVersion ${idAssetVersion}`, LOG.LS.eDB);
                return null;
            }

            // Now that we have a stream, read & parse the scene file
            const svx: SvxReader = new SvxReader();
            const res: H.IOResults = await svx.loadFromStream(readStream);
            if (!res.success || !svx.SvxExtraction) {
                LOG.error(`SceneConstellation.fetchFromAssetVersion unable to read stream from ${RSR.fileName} for idAssetVersion ${idAssetVersion}: ${res.error}`, LOG.LS.eDB);
                return null;
            }

            // If we have a source scene, compute a mapping of model names to idModels, so we can specify the correct ModelSceneXref below
            const modelExistingNameMap: Map<string | null, number> = new Map<string | null, number>();
            const assetExistingNameMap: Map<string | null, number | undefined> = new Map<string | null, number | undefined>();
            if (idScene) {
                const modelSceneXrefs: ModelSceneXref[] | null = await ModelSceneXref.fetchFromScene(idScene);
                if (modelSceneXrefs) {
                    for (const MSX of modelSceneXrefs) {
                        const model: Model | null = await Model.fetch(MSX.idModel);
                        if (model)
                            modelExistingNameMap.set(MSX.Name, model.idModel);
                        else
                            LOG.error(`SceneConstellation.fetchFromAssetVersion unable to read idModel ${MSX.idModel} referenced in ModelSceneXref ${H.Helpers.JSONStringify(MSX)}`, LOG.LS.eDB);
                    }
                } else
                    LOG.error(`SceneConstellation.fetchFromAssetVersion unable to read original ModelSceneXref from idScene ${idScene} for idAssetVersion ${idAssetVersion}`, LOG.LS.eDB);

                const sOI: SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID({ idObject: idScene, eObjectType: COMMON.eSystemObjectType.eScene });
                if (sOI) {
                    const SvxNonModelAsset: SvxNonModelAsset[] | null = await SceneConstellation.computeNonModelAssets(sOI.idSystemObject);
                    if (SvxNonModelAsset) {
                        for (const NMA of SvxNonModelAsset)
                            assetExistingNameMap.set(NMA.uri, NMA.idAssetVersion);
                        LOG.info(`SceneConstellation.fetchFromAssetVersion assetExistingNameMap=${H.Helpers.JSONStringify(assetExistingNameMap)}`, LOG.LS.eDB);
                    } else
                        LOG.error(`SceneConstellation.fetchFromAssetVersion unable to compute non-model assets from idScene ${idScene} for idAssetVersion ${idAssetVersion}`, LOG.LS.eDB);
                } else
                    LOG.error(`SceneConstellation.fetchFromAssetVersion unable to compute system object info from idScene ${idScene} for idAssetVersion ${idAssetVersion}`, LOG.LS.eDB);
            }

            const scene: Scene = svx.SvxExtraction.extractScene();

            let modelSceneXrefs: ModelSceneXref[] | null = null;
            if (svx.SvxExtraction.modelDetails) {
                modelSceneXrefs = [];
                const v1: Vocabulary | undefined = await SceneConstellation.computeVocabAssetTypeModel();
                const v2: Vocabulary | undefined = await SceneConstellation.computeVocabAssetTypeModelGeometryFile();
                const idVAssetType1: number | undefined = v1?.idVocabulary;
                const idVAssetType2: number | undefined = v2?.idVocabulary;
                if (!idVAssetType1 || !idVAssetType2) {
                    LOG.error(`SceneConstellation.fetchFromAssetVersion unable to lookup vocabulary for idAssetVersion ${idAssetVersion}: ${res.error}`, LOG.LS.eDB);
                    return null;
                }

                for (const MSX of svx.SvxExtraction.modelDetails) {
                    // if we have a zip, look for our model within that zip by name
                    if (zip) {
                        const files: string[] = await SceneConstellation.fetchFileFromZip(zip, isBagit, MSX.Name, directory) ?? [];
                        if (files.length === 1) {    // found it ... record it as found but not ingested (i.e. MSX.idModel === -1)
                            MSX.idModel = -1;   // non-zero value, but invalid...
                            modelSceneXrefs.push(MSX);
                            continue;
                        }
                    }

                    let idModel: number | undefined = modelExistingNameMap.get(MSX.Name);
                    if (!idModel) {
                        // Otherwise, look for an existing, matching model using AssetVersion.FileName === MSX.Name and
                        // Asset.idVAssetType IN [Model, ModelGeometryFile]
                        const models: Model[] | null = (MSX.Name) ?
                            await Model.fetchByFileNameAndAssetType(MSX.Name, [idVAssetType1, idVAssetType2]) : null;
                        if (models && models.length > 0)
                            idModel = models[0].idModel;
                    }
                    if (idModel)
                        MSX.idModel = idModel;
                    modelSceneXrefs.push(MSX);
                }

            }

            let nonModelAssets: SvxNonModelAsset[] | null = null;
            if (svx.SvxExtraction.nonModelAssets) {
                const AV = await AssetVersion.fetch(idAssetVersion);
                nonModelAssets = [];
                for (const NMA of svx.SvxExtraction.nonModelAssets) {
                    LOG.info(`SceneConstellation.fetchFromAssetVersion processing nonModelAsset ${H.Helpers.JSONStringify(NMA)}`, LOG.LS.eDB);
                    // if we have a zip, look for our asset within that zip by name
                    if (zip) {
                        const files: string[] = await SceneConstellation.fetchFileFromZip(zip, isBagit, NMA.uri, directory) ?? [];
                        if (files.length === 1) {    // found it ... record it as found but not ingested (i.e. MSX.idModel === -1)
                            NMA.idAssetVersion = -1; // non-zero value, but invalid...
                            nonModelAssets.push(NMA);
                            continue;
                        }
                    }
                    const idAssetVersion: number | undefined = assetExistingNameMap.get(`${AV ? AV.FilePath + '/' : ''}${NMA.uri}`);
                    if (idAssetVersion)
                        NMA.idAssetVersion = idAssetVersion;
                    nonModelAssets.push(NMA);
                }
            }
            // LOG.info(`SceneConstellation.fetchFromAssetVersion scene=${H.Helpers.JSONStringify(scene)}\nmodelSceneXrefs=${H.Helpers.JSONStringify(modelSceneXrefs)}\nnonModelAssets=${H.Helpers.JSONStringify(nonModelAssets)}`, LOG.LS.eDB);
            return new SceneConstellation(scene, modelSceneXrefs, nonModelAssets);
        } finally {
            if (zip)
                await zip.close();
        }
    }

    static async fetchFileFromZip(zip: IZip, isBagit: boolean, filter: string | null, directory: string | undefined): Promise<string[] | null> {
        if (!isBagit)
            return await zip.getJustFiles(filter);

        const allEntries: string[] = await zip.getAllEntries(filter);
        if (!directory)
            return allEntries;

        const retValue: string[] = [];
        for (const fileName of allEntries)
            if (fileName.includes(directory))
                retValue.push(fileName);
        return retValue;
    }

    private static async computeVocabAssetTypeModel(): Promise<Vocabulary | undefined> {
        if (!SceneConstellation.vocabAssetTypeModel) {
            SceneConstellation.vocabAssetTypeModel = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModel);
            if (!SceneConstellation.vocabAssetTypeModel)
                LOG.error('SceneConstellation unable to fetch vocabulary for Asset Type Model', LOG.LS.eDB);
        }
        return SceneConstellation.vocabAssetTypeModel;
    }

    private static async computeVocabAssetTypeModelGeometryFile(): Promise<Vocabulary | undefined> {
        if (!SceneConstellation.vocabAssetTypeModelGeometryFile) {
            SceneConstellation.vocabAssetTypeModelGeometryFile = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile);
            if (!SceneConstellation.vocabAssetTypeModelGeometryFile)
                LOG.error('SceneConstellation unable to fetch vocabulary for Asset Type Model Geometry File', LOG.LS.eDB);
        }
        return SceneConstellation.vocabAssetTypeModelGeometryFile;
    }
}