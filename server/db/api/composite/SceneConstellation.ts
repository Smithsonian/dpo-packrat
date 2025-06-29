import { Scene, Model, ModelSceneXref, AssetVersion, Vocabulary, SystemObjectInfo } from '../..';
import * as STORE from '../../../storage/interface';
import * as CACHE from '../../../cache';
import * as COMMON from '@dpo-packrat/common';
import { IZip } from '../../../utils/IZip';
import { SvxReader, SvxNonModelAsset } from '../../../utils/parser/svxReader';
import * as path from 'path';
import * as H from '../../../utils/helpers';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

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
            RK.logError(RK.LogSection.eDB,'fetch from Scene failed','failed to retrieve Scene',{ idScene, ...this },'DB.Composite.SceneConstellation');
            return null;
        }
        const modelSceneXref: ModelSceneXref[] | null = await ModelSceneXref.fetchFromScene(idScene);
        if (!modelSceneXref) {
            RK.logError(RK.LogSection.eDB,'fetch from Scene failed','failed to retrieve ModelSceneXref',{ idScene, ...this },'DB.Composite.SceneConstellation');
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
            RK.logError(RK.LogSection.eDB,'fetch from Scene failed','failed to compute scene idSystemObject',{ idScene, ...this },'DB.Composite.SceneConstellation');

        return new SceneConstellation(scene, modelSceneXref, SvxNonModelAssets);
    }

    private static async computeNonModelAssets(idSystemObject: number, handledAssetSet?: Set<string> | undefined): Promise<SvxNonModelAsset[] | null> {
        const assetVersions: AssetVersion[] | null = await AssetVersion.fetchLatestFromSystemObject(idSystemObject);
        if (!assetVersions) {
            RK.logError(RK.LogSection.eDB,'compute non-model assets failed','failed to compute scene asset versions',{ idSystemObject, ...this },'DB.Composite.SceneConstellation');
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

            let type: 'Image' | 'Article' | null = null;
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
        RK.logError(RK.LogSection.eDB,'fetch from AssetVersion',undefined,{ idAssetVersion, directory, idScene, ...this },'DB.Composite.SceneConstellation');

        let zip: IZip | null = null;
        let isBagit: boolean = false;
        try {
            // Attempt to read idAssetVersion from storage sytem
            let readStream: NodeJS.ReadableStream | null = null;
            const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersionByID(idAssetVersion);
            if (!RSR.success || !RSR.fileName || !RSR.readStream) {
                RK.logError(RK.LogSection.eDB,'fetch from AssetVersion failed',RSR.error,{ idAssetVersion, directory, idScene, ...this },'DB.Composite.SceneConstellation');
                return null;
            }

            // if our asset is a zip, crack it, and use first .svx.json found as our scene
            let fileName: string = RSR.fileName;
            if (RSR.fileName.toLowerCase().endsWith('.zip')) {
                const CAR: STORE.CrackAssetResult = await STORE.AssetStorageAdapter.crackAssetByAssetVersionID(idAssetVersion);
                if (!CAR.success || !CAR.zip) {
                    RK.logError(RK.LogSection.eDB,'fetch from AssetVersion failed',`crack zipfile ${RSR.fileName} for idAssetVersion: ${CAR.error}`,{ idAssetVersion, directory, idScene, ...this },'DB.Composite.SceneConstellation');
                    return null;
                }
                zip = CAR.zip;
                isBagit = CAR.isBagit;

                const files: string[] = await SceneConstellation.fetchFileFromZip(zip, isBagit, '.svx.json', directory) ?? [];
                if (files.length === 0) {
                    RK.logError(RK.LogSection.eDB,'fetch from AssetVersion failed',`unable to locate scene file with .svx.json extension in zipfile ${RSR.fileName} for AssetVersion`,{ idAssetVersion, directory, idScene, ...this },'DB.Composite.SceneConstellation');
                    return null;
                } else
                    RK.logInfo(RK.LogSection.eDB,'fetch from AssetVersion failed','found scene json in files',{ files },'DB.Composite.SceneConstellation');

                fileName += `/${files[0]}`;
                readStream = await zip.streamContent(files[0]);
            } else
                readStream = RSR.readStream;

            if (!readStream) {
                RK.logError(RK.LogSection.eDB,'fetch from AssetVersion failed',`unable to compute stream from ${fileName} for AssetVersion`,{ idAssetVersion, directory, idScene, ...this },'DB.Composite.SceneConstellation');
                return null;
            }

            // Now that we have a stream, read & parse the scene file
            const svx: SvxReader = new SvxReader();
            const res: H.IOResults = await svx.loadFromStream(readStream);
            if (!res.success || !svx.SvxExtraction) {
                RK.logError(RK.LogSection.eDB,'fetch from AssetVersion failed',`unable to read stream from ${RSR.fileName} for idAssetVersion: ${res.error}`,{ idAssetVersion, directory, idScene, ...this },'DB.Composite.SceneConstellation');
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
                            RK.logError(RK.LogSection.eDB,'fetch from AssetVersion failed',`unable to read idModel ${MSX.idModel} referenced in ModelSceneXref`,{ MSX, idAssetVersion, directory, idScene, ...this },'DB.Composite.SceneConstellation');
                    }
                } else
                    RK.logError(RK.LogSection.eDB,'fetch from AssetVersion failed','unable to read original ModelSceneXref from Scene for AssetVersion',{ idAssetVersion, directory, idScene, ...this },'DB.Composite.SceneConstellation');

                const sOI: SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID({ idObject: idScene, eObjectType: COMMON.eSystemObjectType.eScene });
                if (sOI) {
                    const SvxNonModelAsset: SvxNonModelAsset[] | null = await SceneConstellation.computeNonModelAssets(sOI.idSystemObject);
                    if (SvxNonModelAsset) {
                        for (const NMA of SvxNonModelAsset)
                            assetExistingNameMap.set(NMA.uri, NMA.idAssetVersion);
                        RK.logInfo(RK.LogSection.eDB,'fetch from AssetVersion','existing asset name map',{ assetExistingNameMap },'DB.Composite.SceneConstellation');
                    } else
                        RK.logError(RK.LogSection.eDB,'fetch from AssetVersion failed','unable to compute non-model assets from Scene for AssetVersion',{ idAssetVersion, directory, idScene, ...this },'DB.Composite.SceneConstellation');
                } else
                    RK.logError(RK.LogSection.eDB,'fetch from AssetVersion failed','unable to compute system object info from Scene for AssetVersion',{ idAssetVersion, directory, idScene, ...this },'DB.Composite.SceneConstellation');
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
                    RK.logError(RK.LogSection.eDB,'fetch from AssetVersion failed',`unable to lookup vocabulary for AssetVersion: ${res.error}`,{ idAssetVersion, directory, idScene, ...this },'DB.Composite.SceneConstellation');
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
                if (!AV) {
                    RK.logError(RK.LogSection.eDB,'fetch from AssetVersion failed','unable fetch AssetVersion',{ idAssetVersion, directory, idScene, ...this },'DB.Composite.SceneConstellation');
                    return null;
                }
                nonModelAssets = [];
                for (const NMA of svx.SvxExtraction.nonModelAssets) {
                    RK.logInfo(RK.LogSection.eDB,'fetch from AssetVersion failed','processing non-Model asset',{ NMA },'DB.Composite.SceneConstellation');
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
                RK.logError(RK.LogSection.eDB,'compute vocab asset type model failed','unable to fetch vocabulary',{ ...this },'DB.Composite.SceneConstellation');
        }
        return SceneConstellation.vocabAssetTypeModel;
    }

    private static async computeVocabAssetTypeModelGeometryFile(): Promise<Vocabulary | undefined> {
        if (!SceneConstellation.vocabAssetTypeModelGeometryFile) {
            SceneConstellation.vocabAssetTypeModelGeometryFile = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile);
            if (!SceneConstellation.vocabAssetTypeModelGeometryFile)
                RK.logError(RK.LogSection.eDB,'compute vocab from model geometry file failed','unable to fetch vocabulary for Asset Type Model Geometry File',{ ...this },'DB.Composite.SceneConstellation');
        }
        return SceneConstellation.vocabAssetTypeModelGeometryFile;
    }
}