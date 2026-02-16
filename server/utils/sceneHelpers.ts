import * as DBAPI from '../db';
import * as CACHE from '../cache';
import * as STORE from '../storage/interface';
import * as META from '../metadata';
import * as COL from '../collections/interface/';
import * as H from './helpers';
import * as COMMON from '@dpo-packrat/common';
import { RecordKeeper as RK } from '../records/recordKeeper';
import { IngestSceneAttachmentInput } from '../types/graphql';
import { SvxReader, SvxExtraction } from './parser';
import { JobCookSIPackratInspectOutput } from '../job/impl/Cook';
import { WorkflowUtil } from '../workflow/impl/Packrat/WorkflowUtil';
import { Readable } from 'stream';

export type EdanRecordIdResult = {
    status: 'assigned' | 'assigned_multisubject' | 'mismatch' | 'missing_svx' | 'missing_db' | 'not_found' | 'no_subject' | 'invalid_multisubject' | 'missing_multisubject' | 'error';
    valid: boolean;
    svxEdanRecordId: string | null;
    dbEdanRecordId: string | null;
    subjectCount: number;
    message: string;
};

type AssetPair = {
    asset: DBAPI.Asset;
    assetVersion?: DBAPI.AssetVersion | undefined;
};

export class SceneHelpers {
    private static vocabularyPurposeVoyagerSceneModel: DBAPI.Vocabulary | undefined = undefined;
    private static idVocabEdanRecordID: number | null = null;

    // Suffixes for Voyager-generated download zip bundles inside Scene packages
    // Keep in sync with JobCookSIGenerateDownloads.verifyIncomingCookData and AssetStorageAdapter classification.
    // private static readonly sceneDownloadZipSuffixes: string[] = [
    //     '-full_resolution-obj_std.zip',
    //     '-150k-4096-gltf_std.zip',
    //     '-150k-4096-obj_std.zip',
    // ];

    // Suffixes for canonical model geometry files referenced by SVX modelDetails
    // private static readonly sceneModelBaseSuffixes: string[] = [
    //     '-150k-4096_std.glb',
    //     '-100k-2048_std_draco.glb',
    //     '-100k-2048_std.usdz',
    // ];

    /** Validates the EDAN Record ID for a scene by comparing the SVX file value against the DB Identifier.
     *  Multi-subject scenes require an `edanlists:` prefix; single-subject scenes require SVX-to-DB match. */
    static async validateEdanRecordId(idSystemObject: number, idScene: number): Promise<EdanRecordIdResult> {
        const fail = (status: EdanRecordIdResult['status'], message: string,
            svx: string | null = null, db: string | null = null, subjectCount: number = 0): EdanRecordIdResult =>
            ({ status, valid: false, svxEdanRecordId: svx, dbEdanRecordId: db, subjectCount, message });

        // 1. Resolve vocabulary ID for EDAN Record ID (cache on success)
        if (SceneHelpers.idVocabEdanRecordID === null) {
            const vocab: DBAPI.Vocabulary | undefined =
                await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eIdentifierIdentifierTypeEdanRecordID);
            if (!vocab)
                return fail('error', 'EDAN Record ID vocabulary not found in cache');
            SceneHelpers.idVocabEdanRecordID = vocab.idVocabulary;
        }
        const idVocab: number = SceneHelpers.idVocabEdanRecordID;

        // 2. Scene -> Items -> Subjects
        const items: DBAPI.Item[] | null = await DBAPI.Item.fetchMasterFromScenes([idScene]);
        const allItemIds: number[] = items ? items.map(i => i.idItem) : [];
        const subjects: DBAPI.Subject[] | null = allItemIds.length > 0
            ? await DBAPI.Subject.fetchMasterFromItems(allItemIds)
            : null;
        const subjectCount: number = subjects ? subjects.length : 0;

        if (subjectCount === 0)
            return fail('no_subject', 'No Subject linked to scene; cannot validate EDAN Record ID');

        // 3. Read the SVX edanRecordId from the latest scene asset
        let svxEdanRecordId: string | null = null;
        const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchLatestFromSystemObject(idSystemObject);
        if (assetVersions) {
            for (const av of assetVersions) {
                const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(av.idAsset);
                if (!asset) continue;
                const sceneSO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
                if (!sceneSO) continue;
                if (await CACHE.VocabularyCache.isPreferredAsset(asset.idVAssetType, sceneSO)) {
                    const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersionByID(av.idAssetVersion);
                    if (RSR.success && RSR.readStream) {
                        const svxReader: SvxReader = new SvxReader();
                        const svxRes: H.IOResults = await svxReader.loadFromStream(RSR.readStream);
                        if (svxRes.success && svxReader.SvxExtraction)
                            svxEdanRecordId = svxReader.SvxExtraction.edanRecordId;
                    }
                    break;
                }
            }
        }

        // 4. Read the DB edanRecordId from the first subject's identifiers
        let dbEdanRecordId: string | null = null;
        if (subjects) {
            for (const subject of subjects) {
                const subjectSO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetchFromSubjectID(subject.idSubject);
                if (!subjectSO) continue;
                const identifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromSystemObject(subjectSO.idSystemObject);
                if (!identifiers) continue;
                for (const ident of identifiers) {
                    if (ident.idVIdentifierType === idVocab) {
                        dbEdanRecordId = ident.IdentifierValue;
                        break;
                    }
                }
                if (dbEdanRecordId) break;
            }
        }

        // 5. Multi-subject branch
        if (subjectCount > 1) {
            if (!svxEdanRecordId)
                return fail('missing_multisubject', 'Multi-subject scene requires edanlists: ID in SVX, none found',
                    null, dbEdanRecordId, subjectCount);
            if (!svxEdanRecordId.startsWith('edanlists:'))
                return fail('invalid_multisubject',
                    `Multi-subject scene requires edanlists: ID, found (${svxEdanRecordId})`,
                    svxEdanRecordId, dbEdanRecordId, subjectCount);
            return {
                status: 'assigned_multisubject', valid: true,
                svxEdanRecordId, dbEdanRecordId, subjectCount,
                message: `EDAN Record ID assigned for multi-subject scene (${svxEdanRecordId})`
            };
        }

        // 6. Single-subject branch
        if (svxEdanRecordId && dbEdanRecordId) {
            if (svxEdanRecordId === dbEdanRecordId)
                return {
                    status: 'assigned', valid: true,
                    svxEdanRecordId, dbEdanRecordId, subjectCount,
                    message: `EDAN Record ID assigned (${svxEdanRecordId})`
                };
            return fail('mismatch',
                `SVX (${svxEdanRecordId}) does not match DB (${dbEdanRecordId})`,
                svxEdanRecordId, dbEdanRecordId, subjectCount);
        }
        if (!svxEdanRecordId && dbEdanRecordId)
            return fail('missing_svx',
                `EDAN Record ID missing in SVX; DB has (${dbEdanRecordId})`,
                null, dbEdanRecordId, subjectCount);
        if (svxEdanRecordId && !dbEdanRecordId)
            return fail('missing_db',
                `SVX has (${svxEdanRecordId}) but not found in DB Subject identifier`,
                svxEdanRecordId, null, subjectCount);
        return fail('not_found', 'No EDAN Record ID found in SVX or DB',
            null, null, subjectCount);
    }

    /** Patches the edanRecordId in the SVX JSON's metas[].collection and ingests the updated file as a new asset version. */
    static async patchSvxEdanRecordId(idSystemObject: number, scene: DBAPI.Scene, newEdanRecordId: string, idUser: number): Promise<H.IOResults> {
        // 1. Find the preferred SVX asset and its latest version
        const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchLatestFromSystemObject(idSystemObject);
        if (!assetVersions)
            return { success: false, error: 'Cannot fetch asset versions for scene' };

        let svxAsset: DBAPI.Asset | null = null;
        let svxAssetVersion: DBAPI.AssetVersion | null = null;
        const sceneSO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
        if (!sceneSO)
            return { success: false, error: `Cannot fetch SystemObject ${idSystemObject}` };

        for (const av of assetVersions) {
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(av.idAsset);
            if (!asset) continue;
            if (await CACHE.VocabularyCache.isPreferredAsset(asset.idVAssetType, sceneSO)) {
                svxAsset = asset;
                svxAssetVersion = av;
                break;
            }
        }
        if (!svxAsset || !svxAssetVersion)
            return { success: false, error: 'Cannot find preferred SVX asset for scene' };

        // 2. Read raw SVX JSON
        const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersionByID(svxAssetVersion.idAssetVersion);
        if (!RSR.success || !RSR.readStream)
            return { success: false, error: `Cannot read SVX asset version: ${RSR.error}` };

        const buffer: Buffer | null = await H.Helpers.readFileFromStream(RSR.readStream);
        if (!buffer)
            return { success: false, error: 'Cannot read SVX stream into buffer' };

        // 3. Parse as plain JSON (avoids lossy SvxReader round-trip)
        let svxDoc: any; // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            svxDoc = JSON.parse(buffer.toString());
        } catch (err) {
            return { success: false, error: `Cannot parse SVX JSON: ${H.Helpers.getErrorString(err)}` };
        }

        // 4. Patch metas[].collection.edanRecordId
        if (!svxDoc.metas)
            svxDoc.metas = [];
        let patched = false;
        let oldEdanRecordId: string | null = null;
        for (const meta of svxDoc.metas) {
            if (meta.collection) {
                oldEdanRecordId = meta.collection.edanRecordId ?? null;
                meta.collection.edanRecordId = newEdanRecordId;
                patched = true;
                break;
            }
        }
        if (!patched)
            svxDoc.metas.push({ collection: { edanRecordId: newEdanRecordId } });

        // 5. Serialize back with 4-space indent (matches Cook output)
        const updatedJson: string = JSON.stringify(svxDoc, null, 4);

        // 6. Ingest as new asset version
        const comment = oldEdanRecordId
            ? `Updated EDAN Record ID from: ${oldEdanRecordId} to: ${newEdanRecordId}`
            : `Set EDAN Record ID to: ${newEdanRecordId}`;
        const readStream = Readable.from(updatedJson);
        const ISI: STORE.IngestStreamOrFileInput = {
            readStream,
            localFilePath: null,
            asset: svxAsset,
            FileName: svxAssetVersion.FileName,
            FilePath: '',
            idAssetGroup: 0,
            idVAssetType: svxAsset.idVAssetType,
            allowZipCracking: false,
            idUserCreator: idUser,
            SOBased: scene,
            Comment: comment,
        };

        const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
        if (!IAR.success)
            return { success: false, error: `Failed to ingest updated SVX: ${IAR.error}` };

        RK.logInfo(RK.LogSection.eHTTP, 'patch SVX EDAN Record ID', `success: ${newEdanRecordId}`,
            { idSystemObject, idScene: scene.idScene }, 'Utils.Scene');
        return { success: true };
    }

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

    static async recordResourceMetadata(resource: COL.Edan3DResource, idSystemObject: number, idSystemObjectParent: number, idUser: number | null): Promise<H.IOResults> {
        const extractor: META.MetadataExtractor = new META.MetadataExtractor();
        extractor.metadata.set('isAttachment', '1');
        if (resource.type)
            extractor.metadata.set('type', resource.type);
        if (resource.category)
            extractor.metadata.set('category', resource.category);
        if (resource.attributes) {
            for (const attribute of resource.attributes) {
                if (attribute.UNITS)
                    extractor.metadata.set('units', attribute.UNITS);
                else if (attribute.MODEL_FILE_TYPE)
                    extractor.metadata.set('modelType', attribute.MODEL_FILE_TYPE);
                else if (attribute.FILE_TYPE)
                    extractor.metadata.set('fileType', attribute.FILE_TYPE);
                else if (attribute.GLTF_STANDARDIZED)
                    extractor.metadata.set('gltfStandardized', attribute.GLTF_STANDARDIZED ? '1' : '0');
                else if (attribute.DRACO_COMPRESSED)
                    extractor.metadata.set('dracoCompressed', attribute.DRACO_COMPRESSED ? '1' : '0');
            }
        }
        if (resource.title)
            extractor.metadata.set('title', resource.title);
        const results: H.IOResults = await META.MetadataManager.persistExtractor(idSystemObject, idSystemObjectParent, extractor, idUser);
        if (!results.success)
            return SceneHelpers.recordError(results.error);
        return results;
    }

    static async recordAttachmentMetadata(sceneAttachment: IngestSceneAttachmentInput, idSystemObject: number, idSystemObjectParent: number, idUser: number | null): Promise<H.IOResults> {
        const extractor: META.MetadataExtractor = new META.MetadataExtractor();
        extractor.metadata.set('isAttachment', '1');
        if (sceneAttachment.type)
            extractor.metadata.set('type', await SceneHelpers.convertVocabToString(sceneAttachment.type));
        if (sceneAttachment.category)
            extractor.metadata.set('category', await SceneHelpers.convertVocabToString(sceneAttachment.category));
        if (sceneAttachment.units)
            extractor.metadata.set('units', await SceneHelpers.convertVocabToString(sceneAttachment.units));
        if (sceneAttachment.modelType)
            extractor.metadata.set('modelType', await SceneHelpers.convertVocabToString(sceneAttachment.modelType));
        if (sceneAttachment.fileType)
            extractor.metadata.set('fileType', await SceneHelpers.convertVocabToString(sceneAttachment.fileType));
        if (sceneAttachment.gltfStandardized)
            extractor.metadata.set('gltfStandardized', sceneAttachment.gltfStandardized ? '1' : '0');
        if (sceneAttachment.dracoCompressed)
            extractor.metadata.set('dracoCompressed', sceneAttachment.dracoCompressed ? '1' : '0');
        if (sceneAttachment.title)
            extractor.metadata.set('title', sceneAttachment.title);
        const results: H.IOResults = await META.MetadataManager.persistExtractor(idSystemObject, idSystemObjectParent, extractor, idUser);
        if (!results.success)
            return SceneHelpers.recordError(results.error);
        return results;
    }

    /** idAssetVersion is the assetversion ID of the ingested object */
    static async handleComplexIngestionScene(scene: DBAPI.Scene, IAR: STORE.IngestAssetResult,
        idUser?: number | undefined, idAssetVersion?: number | undefined, modelSource?: DBAPI.Model | undefined): Promise<H.IOResults & { transformUpdated: boolean }> {
        if (!IAR.assets || !IAR.assetVersions)
            return SceneHelpers.returnError('handleComplexIngestionScene called without assets or asset versions');

        // get our scene system object so we can find what is attached
        const sceneSO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetchFromSceneID(scene.idScene);
        if (!sceneSO)
            return SceneHelpers.returnError(
                `handleComplexIngestionScene unable to load Scene SystemObject for scene ${H.Helpers.JSONStringify(scene)}`
            );

        // fetch project from scene for workflow tracking
        let idProject: number | undefined = undefined;
        const sceneProjects: DBAPI.Project[] | null = await DBAPI.Project.fetchFromScene(scene.idScene);
        if (sceneProjects && sceneProjects.length > 0)
            idProject = sceneProjects[0].idProject;

        // first, identify assets and asset versions for the scene and models
        let sceneAsset: DBAPI.Asset | null = null;
        let sceneAssetVersion: DBAPI.AssetVersion | undefined = undefined;
        const modelAssetMap: Map<string, AssetPair> = new Map<string, AssetPair>(); // map of asset name -> { asset, asset version }

        const assetVersionMap: Map<number, DBAPI.AssetVersion> = new Map<number, DBAPI.AssetVersion>(); // map of *asset* id -> asset version
        for (const assetVersion of IAR.assetVersions)
            assetVersionMap.set(assetVersion.idAsset, assetVersion); // idAsset is correct here!

        for (const asset of IAR.assets) {
            switch (await asset.assetType()) {
                case COMMON.eVocabularyID.eAssetAssetTypeScene:
                    if (!sceneAsset) {
                        sceneAsset = asset;
                        sceneAssetVersion = assetVersionMap.get(asset.idAsset);
                    } else
                        RK.logError(RK.LogSection.eSYS,'handle complex scene ingestion failed','skipping unexpected scene',{ asset },'Utils.Scene');
                    break;

                case COMMON.eVocabularyID.eAssetAssetTypeModel:
                case COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile: {
                    const assetVersion: DBAPI.AssetVersion | undefined = assetVersionMap.get(asset.idAsset);
                    modelAssetMap.set(asset.FileName.toLowerCase(), { asset, assetVersion });
                } break;
                case undefined:
                    RK.logError(RK.LogSection.eSYS,'handle complex scene ingestion failed','unable to detect asset type',{ asset },'Utils.Scene');
                    break;
            }
        }

        if (!sceneAsset || !sceneAssetVersion)
            return SceneHelpers.returnError(`sceneHelper handleComplexIngestionScene unable to identify asset and/or asset version for the ingested scene ${H.Helpers.JSONStringify(scene)}`);

        // next, retrieve & parse the scene, extracting model references and transforms
        const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAsset(sceneAsset, sceneAssetVersion);
        if (!RSR.success || !RSR.readStream)
            return SceneHelpers.returnError(`sceneHelper handleComplexIngestionScene unable to fetch stream for scene asset ${H.Helpers.JSONStringify(sceneAsset)}: ${RSR.error}`);

        const svx: SvxReader = new SvxReader();
        const res: H.IOResults = await svx.loadFromStream(RSR.readStream);
        if (!res.success || !svx.SvxExtraction)
            return SceneHelpers.returnError(`sceneHelper handleComplexIngestionScene unable to parse scene asset ${H.Helpers.JSONStringify(sceneAsset)}: ${res.error}`);

        let success: boolean = true;
        let transformUpdated: boolean = false;
        let error: string | undefined = undefined;
        SceneHelpers.extractSceneMetrics(scene, svx.SvxExtraction);
        if (!await scene.update()) {
            error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to update scene ${H.Helpers.JSONStringify(scene)}`, error);
            success = false;
        }

        // Track which assets are processed via SVX manifest
        const processedAssets = new Set<string>();

        // finally, create/update Model and ModelSceneXref for each model reference:
        if (svx.SvxExtraction.modelDetails) {
            for (const MSX of svx.SvxExtraction.modelDetails) {
                if (!MSX.Name)
                    continue;

                // Mark this asset as processed so we don't double-handle it
                processedAssets.add(MSX.Name.toLowerCase());

                let model: DBAPI.Model | null = null;

                // look for matching ModelSceneXref
                // scene.idScene, MSX.Name, .Usage, .Quality, .UVResolution
                // if not found, create model and MSX
                // if found, determine if MSX transform has changed; if so, update MSX, and return a status that can be used to kick off download generation workflow
                const JCOutput: JobCookSIPackratInspectOutput | null = idAssetVersion ? await JobCookSIPackratInspectOutput.extractFromAssetVersion(idAssetVersion, MSX.Name) : null;
                if (JCOutput && !JCOutput.success)
                    error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene failed to extract JobCookSIPackratInspectOutput from idAssetVersion ${idAssetVersion}, model ${MSX.Name}`, error);

                const MSXSources: DBAPI.ModelSceneXref[] | null =
                    await DBAPI.ModelSceneXref.fetchFromSceneNameUsageQualityUVResolution(scene.idScene, MSX.Name, MSX.Usage, MSX.Quality, MSX.UVResolution);
                const MSXSource: DBAPI.ModelSceneXref | null = (MSXSources && MSXSources.length > 0) ? MSXSources[0] : null;
                if (MSXSource) {
                    const { transformUpdated: transformUpdatedLocal, updated } = MSXSource.updateIfNeeded(MSX);

                    if (updated) {
                        if (!await MSXSource.update()) {
                            error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to update ModelSceneXref ${H.Helpers.JSONStringify(MSXSource)}`, error);
                            success = false;
                        }
                    }
                    if (transformUpdatedLocal)
                        transformUpdated = true;

                    model = await DBAPI.Model.fetch(MSXSource.idModel);
                    if (!model) {
                        error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to load model ${MSXSource.idModel}`, error);
                        success = false;
                        continue;
                    }
                    RK.logInfo(RK.LogSection.eSYS,'handle complex scene ingestion','found existing ModelSceneXref from reference model',{ MSX, MSXSource },'Utils.Scene');

                    if (JCOutput && JCOutput.success && JCOutput.modelConstellation && JCOutput.modelConstellation.Model) {
                        SceneHelpers.extractModelMetrics(model, JCOutput.modelConstellation.Model);
                        if (!await model.update()) {
                            error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to update model ${MSXSource.idModel} with metrics`, error);
                            success = false;
                        }
                    }
                } else {
                    model = await SceneHelpers.transformModelSceneXrefIntoModel(MSX, modelSource);
                    if (JCOutput && JCOutput.success && JCOutput.modelConstellation && JCOutput.modelConstellation.Model)
                        SceneHelpers.extractModelMetrics(model, JCOutput.modelConstellation.Model);

                    if (!await model.create()) {
                        error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to create model from referenced model ${H.Helpers.JSONStringify(MSX)}`, error);
                        success = false;
                        continue;
                    }
                    RK.logInfo(RK.LogSection.eSYS,'handle complex scene ingestion','created model from reference model',{ model, MSX },'Utils.Scene');

                    // Create ModelSceneXref for model and scene
                    /* istanbul ignore else */
                    if (!MSX.idModelSceneXref) { // should always be true
                        MSX.idModel = model.idModel;
                        MSX.idScene = scene.idScene;
                        if (MSX.Name.length > DBAPI.ModelSceneXref.NameMaxLen)
                            MSX.Name = MSX.Name.substring(0, DBAPI.ModelSceneXref.NameMaxLen - 1);
                        if (!await MSX.create()) {
                            error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to create ModelSceneXref for model xref ${H.Helpers.JSONStringify(MSX)}`, error);
                            success = false;
                        }
                    } else
                        error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unexpected non-null ModelSceneXref for model xref ${H.Helpers.JSONStringify(MSX)}`, error);

                    if (modelSource) {
                        const SOX1: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(modelSource, model);
                        if (!SOX1) {
                            error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to wire master model ${H.Helpers.JSONStringify(modelSource)} and model ${H.Helpers.JSONStringify(model)} together`, error);
                            success = false;
                        }
                    }

                    const SOX2: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(scene, model);
                    if (!SOX2) {
                        error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to wire scene ${H.Helpers.JSONStringify(scene)} and model ${H.Helpers.JSONStringify(model)} together`, error);
                        success = false;
                    }
                }

                const assetPair: AssetPair | undefined = modelAssetMap.get(MSX.Name.toLowerCase());
                if (!assetPair || !assetPair.asset || !assetPair.assetVersion) {
                    RK.logWarning(RK.LogSection.eSYS,'populate model metrics','unable to locate assets for SVX model',{ assetPair, MSX },'Utils.Scene');
                    continue;
                }

                // If we don't have si-packrat-inspect output available, explicitly run that workflow ... but do not await results
                SceneHelpers.populateModelMetrics(model.idModel, assetPair, MSX, idUser, idProject);

                // reassign asset to model; create SystemObjectVersion and SystemObjectVersionAssetVersionXref
                const SO: DBAPI.SystemObject | null = await model.fetchSystemObject();
                if (!SO) {
                    error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to fetch SystemObject for model ${H.Helpers.JSONStringify(model)}`, error);
                    success = false;
                    continue;
                }

                assetPair.asset.idSystemObject = SO.idSystemObject;
                if (!await assetPair.asset.update()) {
                    error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to reassign model asset ${H.Helpers.JSONStringify(assetPair.asset)} to model ${H.Helpers.JSONStringify(model)}`, error);
                    success = false;
                    continue;
                }

                const SOV: DBAPI.SystemObjectVersion = new DBAPI.SystemObjectVersion({
                    idSystemObject: SO.idSystemObject,
                    PublishedState: COMMON.ePublishedState.eNotPublished,
                    DateCreated: new Date(),
                    Comment: null,
                    idSystemObjectVersion: 0
                });
                if (!await SOV.create()) {
                    error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to create SystemObjectVersion ${H.Helpers.JSONStringify(SOV)} for model ${H.Helpers.JSONStringify(model)}`, error);
                    success = false;
                    continue;
                }

                const SOVAVX: DBAPI.SystemObjectVersionAssetVersionXref = new DBAPI.SystemObjectVersionAssetVersionXref({
                    idSystemObjectVersion: SOV.idSystemObjectVersion,
                    idAssetVersion: assetPair.assetVersion.idAssetVersion,
                    idSystemObjectVersionAssetVersionXref: 0,
                });
                if (!await SOVAVX.create()) {
                    error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to create SystemObjectVersionAssetVersionXref ${H.Helpers.JSONStringify(SOVAVX)} for model ${H.Helpers.JSONStringify(model)}`, error);
                    success = false;
                    continue;
                }
            }
        }

        //#region: Orphaned Assets (Downloads/Zips not in SVX)
        // --------------------------------------------------------------
        const vPurposeDownload: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeDownload);

        for (const [name, assetPair] of modelAssetMap) {
            // Skip if already processed via SVX
            if (processedAssets.has(name)) continue;

            // Only process if it is a ModelGeometryFile (this includes zips identified in AssetStorageAdapter)
            const assetType = await assetPair.asset.assetType();
            if (assetType !== COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile) continue;

            const { asset, assetVersion } = assetPair;
            if (!asset || !assetVersion) continue;

            const Name = asset.FileName;
            RK.logInfo(RK.LogSection.eSYS,'handle complex scene ingestion',`processing orphan model asset: ${Name}`,{ asset },'Utils.Scene');

            // Create Model
            const vFileType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapModelFileByExtension(Name);
            const model = new DBAPI.Model({
                idModel: 0,
                Name,
                Title: Name,
                DateCreated: new Date(),
                idVCreationMethod: modelSource?.idVCreationMethod ?? null,
                idVModality: modelSource?.idVModality ?? null,
                idVPurpose: vPurposeDownload ? vPurposeDownload.idVocabulary : null,
                idVUnits: modelSource?.idVUnits ?? null,
                idVFileType: vFileType ? vFileType.idVocabulary : null,
                idAssetThumbnail: null, CountAnimations: null, CountCameras: null, CountFaces: null, CountLights: null, CountMaterials: null,
                CountMeshes: null, CountVertices: null, CountEmbeddedTextures: null, CountLinkedTextures: null, FileEncoding: null, IsDracoCompressed: null,
                AutomationTag: `download-${Name}`,
                CountTriangles: null,
                Variant: modelSource?.Variant ?? '[]',
            });

            if (!await model.create()) {
                error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to create orphan model ${Name}`, error);
                success = false;
                continue;
            }

            // Create ModelSceneXref
            // CRITICAL: Usage must start with 'Download:' for PublishScene to pick it up
            const msx = new DBAPI.ModelSceneXref({
                idModelSceneXref: 0,
                idModel: model.idModel,
                idScene: scene.idScene,
                Name,
                Usage: 'Download:Generic',
                Quality: null,
                FileSize: assetVersion.StorageSize,
                UVResolution: null,
                BoundingBoxP1X: null, BoundingBoxP1Y: null, BoundingBoxP1Z: null,
                BoundingBoxP2X: null, BoundingBoxP2Y: null, BoundingBoxP2Z: null,
                TS0: null, TS1: null, TS2: null,
                R0: null, R1: null, R2: null, R3: null,
                S0: null, S1: null, S2: null,
            });

            if (!await msx.create()) {
                error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to create ModelSceneXref for orphan ${Name}`, error);
                success = false;
            }

            // Wire Objects
            const SOX1: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(scene, model);
            if (!SOX1) {
                error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to wire scene and orphan model ${Name}`, error);
                success = false;
            }

            if (modelSource) {
                const SOX2: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(modelSource, model);
                if (!SOX2) {
                    error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to wire master model and orphan model ${Name}`, error);
                    success = false;
                }
            } else {
                RK.logWarning(RK.LogSection.eSYS, 'handle complex scene ingestion', `unable to wire orphan model ${Name} to master model: master model not found`, {}, 'Utils.Scene');
            }

            // Re-parent Asset to Model
            const SO: DBAPI.SystemObject | null = await model.fetchSystemObject();
            if (SO) {
                asset.idSystemObject = SO.idSystemObject;
                if (!await asset.update()) {
                    error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to reassign orphan asset ${Name} to model`, error);
                    success = false;
                    continue;
                }

                // Create SystemObjectVersion machinery for the new Model
                const SOV: DBAPI.SystemObjectVersion = new DBAPI.SystemObjectVersion({
                    idSystemObject: SO.idSystemObject,
                    PublishedState: COMMON.ePublishedState.eNotPublished,
                    DateCreated: new Date(),
                    Comment: 'Created during Scene Ingestion (Orphan)',
                    idSystemObjectVersion: 0
                });
                if (!await SOV.create()) {
                    error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to create SOV for orphan ${Name}`, error);
                    success = false;
                    continue;
                }

                const SOVAVX: DBAPI.SystemObjectVersionAssetVersionXref = new DBAPI.SystemObjectVersionAssetVersionXref({
                    idSystemObjectVersion: SOV.idSystemObjectVersion,
                    idAssetVersion: assetVersion.idAssetVersion,
                    idSystemObjectVersionAssetVersionXref: 0,
                });
                if (!await SOVAVX.create()) {
                    error = SceneHelpers.logAndAccumulateError(`sceneHelper handleComplexIngestionScene unable to create SOVAVX for orphan ${Name}`, error);
                    success = false;
                }
            }
        }
        //#endregion

        return { success, error, transformUpdated };
    }

    private static logAndAccumulateError(error: string, accum: string | undefined): string {
        RK.logError(RK.LogSection.eSYS,'log error',error,{ accum },'Utils.Scene');

        if (!accum)
            accum = error;
        else
            accum += `; ${error}`;
        return accum;
    }

    private static returnError(error: string): H.IOResults & { transformUpdated: boolean } {
        RK.logError(RK.LogSection.eSYS,'return error',error,{},'Utils.Scene');
        return { success: false, error, transformUpdated: false };
    }

    private static async populateModelMetrics(idModel: number, assetPair: AssetPair, MSX: DBAPI.ModelSceneXref, idUser: number | undefined, idProject: number | undefined): Promise<boolean> {
        if (!assetPair.assetVersion) {
            RK.logError(RK.LogSection.eSYS,'populate model metrics failed','called without assetVersion',{ idModel, assetPair, MSX },'Utils.Scene');
            return false;
        }
        if (!MSX.Name) {
            RK.logError(RK.LogSection.eSYS,'populate model metrics failed','called without ModelSceneXref Name',{},'Utils.Scene');
            return false;
        }

        const SOModelAssetVersion: DBAPI.SystemObject | null = await assetPair.assetVersion.fetchSystemObject();
        if (!SOModelAssetVersion) {
            RK.logError(RK.LogSection.eSYS,'populate model metrics failed','unable to fetch system object from model asset version',{ idModel, assetPair, MSX },'Utils.Scene');
            return false;
        }

        const results: H.IOResults = await WorkflowUtil.computeModelMetrics(MSX.Name, idModel, undefined, SOModelAssetVersion.idSystemObject, undefined, undefined, idProject, idUser);
        if (!results.success)
            RK.logError(RK.LogSection.eSYS,'populate model metrics failed',`cannot compute JobCookSIPackratInspectOutput from idAssetVersion: ${results.error}`,{ idModel, assetPair, MSX },'Utils.Scene');

        const JCOutput: JobCookSIPackratInspectOutput | null = await JobCookSIPackratInspectOutput.extractFromAssetVersion(assetPair.assetVersion.idAssetVersion, MSX.Name);
        if (JCOutput && !JCOutput.success)
            RK.logError(RK.LogSection.eSYS,'populate model metrics failed','cannot extract JobCookSIPackratInspectOutput from idAssetVersion',{ idModel, assetPair, MSX },'Utils.Scene');

        if (JCOutput && JCOutput.success && JCOutput.modelConstellation && JCOutput.modelConstellation.Model) {
            const model: DBAPI.Model | null = await DBAPI.Model.fetch(idModel);
            if (!model) {
                RK.logError(RK.LogSection.eSYS,'populate model metrics failed','unable to fetch model',{ idModel },'Utils.Scene');
                return false;
            }
            SceneHelpers.extractModelMetrics(model, JCOutput.modelConstellation.Model);
            if (!await model.update()) {
                RK.logError(RK.LogSection.eSYS,'populate model metrics failed','unable to update model',{ idModel },'Utils.Scene');
                return false;
            }
        }
        return true;
    }

    private static extractSceneMetrics(scene: DBAPI.Scene, svxExtraction: SvxExtraction): void {
        const sceneExtract: DBAPI.Scene = svxExtraction.extractScene();
        scene.CountScene = sceneExtract.CountScene;
        scene.CountNode = sceneExtract.CountNode;
        scene.CountCamera = sceneExtract.CountCamera;
        scene.CountLight = sceneExtract.CountLight;
        scene.CountModel = sceneExtract.CountModel;
        scene.CountMeta = sceneExtract.CountMeta;
        scene.CountSetup = sceneExtract.CountSetup;
        scene.CountTour = sceneExtract.CountTour;
    }

    private static async transformModelSceneXrefIntoModel(MSX: DBAPI.ModelSceneXref, modelSource?: DBAPI.Model | undefined): Promise<DBAPI.Model> {
        const Name: string = MSX.Name ?? '';
        const vFileType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapModelFileByExtension(Name);
        const vPurpose: DBAPI.Vocabulary | undefined = await SceneHelpers.getVocabularyVoyagerSceneModel();
        return new DBAPI.Model({
            idModel: 0,
            Name,
            Title: '',
            DateCreated: new Date(),
            idVCreationMethod: modelSource?.idVCreationMethod ?? null,
            idVModality: modelSource?.idVModality ?? null,
            idVPurpose: vPurpose ? vPurpose.idVocabulary : null,
            idVUnits: modelSource?.idVUnits ?? null,
            idVFileType: vFileType ? vFileType.idVocabulary : null,
            idAssetThumbnail: null, CountAnimations: null, CountCameras: null, CountFaces: null, CountLights: null, CountMaterials: null,
            CountMeshes: null, CountVertices: null, CountEmbeddedTextures: null, CountLinkedTextures: null, FileEncoding: null, IsDracoCompressed: null,
            AutomationTag: MSX.computeModelAutomationTag(), CountTriangles: null,
            Variant: modelSource?.Variant ?? '[]',
        });
    }

    private static extractModelMetrics(model: DBAPI.Model, modelMetrics: DBAPI.Model): void {
        if (!model.Title)
            model.Title = modelMetrics.Title;
        model.CountAnimations = modelMetrics.CountAnimations;
        model.CountCameras = modelMetrics.CountCameras;
        model.CountFaces = modelMetrics.CountFaces;
        model.CountTriangles = modelMetrics.CountTriangles;
        model.CountLights = modelMetrics.CountLights;
        model.CountMaterials = modelMetrics.CountMaterials;
        model.CountMeshes = modelMetrics.CountMeshes;
        model.CountVertices = modelMetrics.CountVertices;
        model.CountEmbeddedTextures = modelMetrics.CountEmbeddedTextures;
        model.CountLinkedTextures = modelMetrics.CountLinkedTextures;
        model.FileEncoding = modelMetrics.FileEncoding;
        model.IsDracoCompressed = modelMetrics.IsDracoCompressed;
    }

    private static async getVocabularyVoyagerSceneModel(): Promise<DBAPI.Vocabulary | undefined> {
        if (!SceneHelpers.vocabularyPurposeVoyagerSceneModel) {
            SceneHelpers.vocabularyPurposeVoyagerSceneModel = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeVoyagerSceneModel);
            if (!SceneHelpers.vocabularyPurposeVoyagerSceneModel) {
                RK.logError(RK.LogSection.eSYS,'get vocab voyager scene failed','unable to fetch vocabulary for Voyager Scene Model Model Purpose',{},'Utils.Scene');
                return undefined;
            }
        }
        return SceneHelpers.vocabularyPurposeVoyagerSceneModel;
    }

    private static async convertVocabToString(idVocabulary: number): Promise<string> {
        const vocab: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(idVocabulary);
        return vocab ? vocab.Term : '';
    }

    private static recordError(error: string | undefined): H.IOResults {
        RK.logError(RK.LogSection.eSYS,'record error',error,{},'Utils.Scene');
        return { success: false, error };
    }
}