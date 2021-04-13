/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import { JobCook } from './JobCook';
import { CookRecipe } from './CookRecipe';
import { Config } from '../../../config';

import * as JOB from '../../interface';
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as STORE from '../../../storage/interface';
import * as H from '../../../utils/helpers';
import { ZipStream } from '../../../utils/zipStream';
import { maybe, maybeString } from '../../../utils/types';

import { isArray } from 'lodash';
import * as path from 'path';

export class JobCookSIPackratInspectParameters {
    constructor(sourceMeshFile: string, sourceMaterialFiles: string | undefined = undefined) {
        this.sourceMeshFile = sourceMeshFile;
        this.sourceMaterialFiles = sourceMaterialFiles;
    }
    sourceMeshFile: string;
    sourceMaterialFiles?: string | undefined;
}

export class JobCookBoundingBox {
    min: number[];
    max: number[];
    constructor(min: number[], max: number[]) {
        this.min = min;
        this.max = max;
    }

    static extract(boundingBox: any): JobCookBoundingBox | null {
        const bbMinV: any = boundingBox?.min;
        const bbMaxV: any = boundingBox?.max;
        const bbMin: number[] | null = (bbMinV && isArray(bbMinV) && bbMinV.length == 3) ? bbMinV : null;
        const bbMax: number[] | null = (bbMaxV && isArray(bbMaxV) && bbMaxV.length == 3) ? bbMaxV : null;
        return bbMin && bbMax ? new JobCookBoundingBox(bbMin, bbMax) : null;
    }
}

export class JobCookStatistics {
    numFaces: number | null = null;
    numVertices: number | null = null;
    numTexCoordChannels: number | null = null;
    numColorChannels: number | null = null;
    hasNormals: boolean | null = null;
    hasVertexNormals: boolean | null = null;
    hasVertexColors: boolean | null = null;
    hasTexCoords: boolean | null = null;
    hasBones: boolean | null = null;
    hasTangents: boolean | null = null;
    isTwoManifoldUnbounded: boolean | null = null;
    isTwoManifoldBounded: boolean | null = null;
    selfIntersecting: boolean | null = null;
    isWatertight: boolean | null = null;
    materialIndex: number[] | null = null;

    static extract(statistics: any): JobCookStatistics {
        const JCStat: JobCookStatistics = new JobCookStatistics();
        JCStat.numFaces = maybe<number>(statistics?.numFaces);
        JCStat.numVertices = maybe<number>(statistics?.numVertices);
        JCStat.numTexCoordChannels = maybe<number>(statistics?.numTexCoordChannels);
        JCStat.numColorChannels = maybe<number>(statistics?.numColorChannels);
        JCStat.hasNormals = maybe<boolean>(statistics?.hasNormals);
        JCStat.hasVertexNormals = maybe<boolean>(statistics?.hasVertexNormals);
        JCStat.hasVertexColors = maybe<boolean>(statistics?.hasVertexColors);
        JCStat.hasTexCoords = maybe<boolean>(statistics?.hasTexCoords);
        JCStat.hasBones = maybe<boolean>(statistics?.hasBones);
        JCStat.hasTangents = maybe<boolean>(statistics?.hasTangents);
        JCStat.isTwoManifoldUnbounded = maybe<boolean>(statistics?.isTwoManifoldUnbounded);
        JCStat.isTwoManifoldBounded = maybe<boolean>(statistics?.isTwoManifoldBounded);
        JCStat.selfIntersecting = maybe<boolean>(statistics?.selfIntersecting);
        JCStat.isWatertight = maybe<boolean>(statistics?.isWatertight);
        JCStat.materialIndex = maybe<number[]>(statistics?.materialIndex);
        return JCStat;
    }
}

export class JobCookSIPackratInspectOutput implements H.IOResults {
    success: boolean = true;
    error: string = '';
    // NOTE: These objects are not persisted to the database.  Their ID fields are initialized starting at 1,
    // and are populated only to link related objects together, both for UI display purposes and to assist with
    // future persisting.  That being said, the IDs need to be set to 0 before being inserted, and then patched
    // up in related objects. Use the helper method, persist(), to write this constellation of objects to the
    // database with proper IDs
    modelConstellation: DBAPI.ModelConstellation | null = null;

    /** Persists subobjects found in JobCookSIPackratInspectOutput's ModelConstellation.
     * @param idModel If idModel > 0, we update that model; otherwise we create one
     * @param assetMap Map of asset filename -> idAsset; assets referenced but missing in this map will cause an error
     */
    async persist(idModel: number, assetMap: Map<string, number>): Promise<H.IOResults> {
        if (!this.modelConstellation || !this.modelConstellation.Model || !this.modelConstellation.ModelObjects) {
            const error: string = 'Invalid JobCookSIPackratInspectOutput';
            LOG.logger.error(`JobCookSIPackratInspectOutput.persist: ${error}`);
            return { success: false, error };
        }

        const modelSource: DBAPI.Model = this.modelConstellation.Model;
        const modelObjectIDMap: Map<number, number> = new Map<number, number>(); // map of fake id -> real id
        const modelMaterialIDMap: Map<number, number> = new Map<number, number>(); // map of fake id -> real id
        const modelMaterialUVMapIDMap: Map<number, number> = new Map<number, number>(); // map of fake id -> real id
        const assetIDMap: Map<number, number> = new Map<number, number>(); // map of fake id -> real id

        // map and validate assets:
        if (this.modelConstellation.ModelAssets) {
            for (const modelAsset of this.modelConstellation.ModelAssets) {
                let mappedId: number | undefined = assetMap.get(modelAsset.Asset.FileName);
                if (!mappedId) // try again, with just filename
                    mappedId = assetMap.get(path.basename(modelAsset.Asset.FileName));
                if (!mappedId) {
                    const error: string = `Missing ${modelAsset.Asset.FileName} and ${path.basename(modelAsset.Asset.FileName)} from assetMap ${JSON.stringify(assetMap, H.Helpers.stringifyCallbackCustom)}`;
                    LOG.logger.error(`JobCookSIPackratInspectOutput.persist: ${error}`);
                    // return { success: false, error };
                    continue;
                }
                assetIDMap.set(modelAsset.Asset.idAsset, mappedId);
            }
        }

        // Persist model.  If we're given a model id, retrieve that model, populate metrics, and persist it; otherwise create one
        if (idModel) {
            const model: DBAPI.Model | null = await DBAPI.Model.fetch(idModel);
            if (!model) {
                const error: string = `Failed to fetch model ${idModel}`;
                LOG.logger.error(`JobCookSIPackratInspectOutput.persist: ${error}`);
                return { success: false, error };
            }

            if (modelSource.CountAnimations)
                model.CountAnimations = modelSource.CountAnimations;
            if (modelSource.CountCameras)
                model.CountCameras = modelSource.CountCameras;
            if (modelSource.CountFaces)
                model.CountFaces = modelSource.CountFaces;
            if (modelSource.CountLights)
                model.CountLights = modelSource.CountLights;
            if (modelSource.CountMaterials)
                model.CountMaterials = modelSource.CountMaterials;
            if (modelSource.CountMeshes)
                model.CountMeshes = modelSource.CountMeshes;
            if (modelSource.CountVertices)
                model.CountVertices = modelSource.CountVertices;
            if (modelSource.CountEmbeddedTextures)
                model.CountEmbeddedTextures = modelSource.CountEmbeddedTextures;
            if (modelSource.CountLinkedTextures)
                model.CountLinkedTextures = modelSource.CountLinkedTextures;
            if (modelSource.FileEncoding)
                model.FileEncoding = modelSource.FileEncoding;

            if (!await model.update())
                return { success: false, error: 'Model.update() failed' };
            this.modelConstellation.Model = model;
        } else {
            this.modelConstellation.Model.idModel = 0;  // reset to ensure auto-increment kicks in
            if (!await this.modelConstellation.Model.create())
                return { success: false, error: 'Model.create() failed' };
        }

        // Persist ModelObjects
        for (const modelObject of this.modelConstellation.ModelObjects) {
            const fakeId: number = modelObject.idModelObject;
            modelObject.idModelObject = 0;
            modelObject.idModel = this.modelConstellation.Model.idModel;
            if (!await modelObject.create())
                return { success: false, error: 'ModelObject.create() failed' };
            modelObjectIDMap.set(fakeId, modelObject.idModelObject);
        }

        // Persist ModelMaterials
        if (this.modelConstellation.ModelMaterials) {
            for (const modelMaterial of this.modelConstellation.ModelMaterials) {
                const fakeId: number = modelMaterial.idModelMaterial;
                modelMaterial.idModelMaterial = 0;
                if (!await modelMaterial.create())
                    return { success: false, error: 'ModelMaterial.create() failed' };
                modelMaterialIDMap.set(fakeId, modelMaterial.idModelMaterial);
            }
        }

        // Persist ModelMaterialUVMaps
        if (this.modelConstellation.ModelMaterialUVMaps) {
            for (const modelMaterialUVMap of this.modelConstellation.ModelMaterialUVMaps) {
                const mappedAssetId: number | undefined = assetIDMap.get(modelMaterialUVMap.idAsset);
                if (!mappedAssetId) {
                    const error: string = `Missing ${modelMaterialUVMap.idAsset} from asset ID Map`;
                    LOG.logger.error(`JobCookSIPackratInspectOutput.persist: ${error}`);
                    // return { success: false, error };
                    continue;
                }

                const fakeId: number = modelMaterialUVMap.idModelMaterialUVMap;
                modelMaterialUVMap.idModelMaterialUVMap = 0;
                modelMaterialUVMap.idModel = this.modelConstellation.Model.idModel;
                modelMaterialUVMap.idAsset = mappedAssetId;
                if (!await modelMaterialUVMap.create())
                    return { success: false, error: 'ModelMaterialUVMap.create() failed' };
                modelMaterialUVMapIDMap.set(fakeId, modelMaterialUVMap.idModelMaterialUVMap);
            }
        }

        // Persist ModelMaterialChannels
        if (this.modelConstellation.ModelMaterialChannels) {
            for (const modelMaterialChannel of this.modelConstellation.ModelMaterialChannels) {
                const mappedModelMaterialId: number | undefined = modelMaterialIDMap.get(modelMaterialChannel.idModelMaterial);
                if (!mappedModelMaterialId) {
                    const error: string = `Missing ${modelMaterialChannel.idModelMaterial} from model material ID map`;
                    LOG.logger.error(`JobCookSIPackratInspectOutput.persist: ${error}`);
                    // return { success: false, error };
                    continue;
                }

                let mappedModelMaterialUVMapId: number | null | undefined = null;
                if (modelMaterialChannel.idModelMaterialUVMap) {
                    mappedModelMaterialUVMapId = modelMaterialUVMapIDMap.get(modelMaterialChannel.idModelMaterialUVMap);
                    if (!mappedModelMaterialUVMapId) {
                        const error: string = `Missing ${modelMaterialChannel.idModelMaterialUVMap} from model material UV ID map`;
                        LOG.logger.error(`JobCookSIPackratInspectOutput.persist: ${error}`);
                        // return { success: false, error };
                        continue;
                    }
                }

                modelMaterialChannel.idModelMaterialChannel = 0;
                modelMaterialChannel.idModelMaterial = mappedModelMaterialId;
                modelMaterialChannel.idModelMaterialUVMap = mappedModelMaterialUVMapId;
                if (!await modelMaterialChannel.create())
                    return { success: false, error: 'ModelMaterialChannel.create() failed' };
            }
        }

        // Persist ModelObjectModelMaterialXrefs
        if (this.modelConstellation.ModelObjectModelMaterialXref) {
            for (const modelObjectModelMaterialXref of this.modelConstellation.ModelObjectModelMaterialXref) {
                const mappedModelMaterialId: number | undefined = modelMaterialIDMap.get(modelObjectModelMaterialXref.idModelMaterial);
                if (!mappedModelMaterialId) {
                    const error: string = `Missing ${modelObjectModelMaterialXref.idModelMaterial} from model material ID map`;
                    LOG.logger.error(`JobCookSIPackratInspectOutput.persist: ${error}`);
                    // return { success: false, error };
                    continue;
                }

                const mappedModelObjectId: number | undefined = modelObjectIDMap.get(modelObjectModelMaterialXref.idModelObject);
                if (!mappedModelObjectId) {
                    const error: string = `Missing ${modelObjectModelMaterialXref.idModelObject} from model object ID map`;
                    LOG.logger.error(`JobCookSIPackratInspectOutput.persist: ${error}`);
                    // return { success: false, error };
                    continue;
                }

                modelObjectModelMaterialXref.idModelObjectModelMaterialXref = 0;
                modelObjectModelMaterialXref.idModelMaterial = mappedModelMaterialId;
                modelObjectModelMaterialXref.idModelObject = mappedModelObjectId;
                if (!await modelObjectModelMaterialXref.create())
                    return { success: false, error: 'ModelObjectModelMaterialXref.create() failed' };
            }
        }
        return { success: true, error: '' };
    }

    static async extract(output: any, fileName: string | null, dateCreated: Date | null): Promise<JobCookSIPackratInspectOutput> {
        const JCOutput: JobCookSIPackratInspectOutput = new JobCookSIPackratInspectOutput();

        const modelObjects: DBAPI.ModelObject[] = [];
        let modelMaterials: DBAPI.ModelMaterial[] | null = null;
        let modelMaterialChannels: DBAPI.ModelMaterialChannel[] | null = null;
        let modelObjectModelMaterialXrefs: DBAPI.ModelObjectModelMaterialXref[] | null = null;
        let modelMaterialUVMaps: DBAPI.ModelMaterialUVMap[] | null = null;
        let modelAssets: DBAPI.ModelAsset[] | null = null;

        const modelMaterialUVMapIDs: Map<string, number> = new Map<string, number>(); // map of material URI -> ModelMaterialUVMap.idModelMaterialUVMap
        const modelMaterialChannelList: Map<string, string[]> = new Map<string, string[]>();  // map of material URI -> material channel list;

        const sourceMeshFile: string | null = maybe<string>(output?.parameters?.sourceMeshFile);
        const steps: any = output?.steps;
        const mergeReport: any = steps ? steps['merge-reports'] : undefined;
        const inspection: any = mergeReport?.result?.inspection;
        const meshes: any[] | undefined = inspection?.meshes;
        const materials: any[] | undefined = inspection?.scene?.materials;
        const materialCount: number = materials ? materials.length : 0;
        const modelStats: any | undefined = inspection?.scene?.statistics;

        if (!meshes) {
            JCOutput.success = false;
            JCOutput.error = 'Job output is missing mesh detail';
            return JCOutput;
        }

        let idModel: number = 0;
        let idModelObject: number = 0;
        let idModelMaterial: number = 0;
        let idModelMaterialUVMap: number = 0;
        let idModelMaterialChannel: number = 0;
        let idModelObjectModelMaterialXref: number = 0;
        let idAsset: number = 0;
        let idAssetVersion: number = 0;

        const model: DBAPI.Model = await JobCookSIPackratInspectOutput.createModel(++idModel, modelStats, fileName, dateCreated);

        if (sourceMeshFile) {
            if (!modelAssets)
                modelAssets = [];
            modelAssets.push(JobCookSIPackratInspectOutput.createModelAsset(++idAsset, ++idAssetVersion, sourceMeshFile, true, null));
        }

        for (const mesh of meshes) {
            idModelObject++;
            const statistics: any = mesh.statistics;
            if (!statistics) {
                LOG.logger.error(`JobCookSIPackratInspectOutput.extract missing steps['merge-reports'].result.inspection.meshes[${idModelObject - 1}].statistics: ${JSON.stringify(output)}`);
                continue;
            }

            const boundingBox: any = mesh.geometry?.boundingBox;
            const JCBoundingBox: JobCookBoundingBox | null = JobCookBoundingBox.extract(boundingBox);
            const JCStat: JobCookStatistics = JobCookStatistics.extract(statistics);
            modelObjects.push(JobCookSIPackratInspectOutput.createModelObject(idModelObject, idModel, JCBoundingBox, JCStat));

            // ModelObjectModelMaterialXref
            if (JCStat.materialIndex) {
                for (const materialIndex of JCStat.materialIndex) { // 0-based index
                    // validate materialIndex for our material array
                    if ((materialIndex + 1) > materialCount) {
                        JCOutput.success = false;
                        JCOutput.error = `Invalid materialIndex ${materialIndex}`;
                        LOG.logger.error(`JobCookSIPackratInspectOutput.extract: ${JCOutput.error}`);
                        continue;
                    }

                    idModelObjectModelMaterialXref++;
                    const modelObjectModelMaterialXref: DBAPI.ModelObjectModelMaterialXref = new DBAPI.ModelObjectModelMaterialXref({
                        idModelObjectModelMaterialXref,
                        idModelObject,
                        idModelMaterial: materialIndex + 1, // idModelMaterial, the idModelMaterial is 1 more than the index into our material array
                    });

                    if (!modelObjectModelMaterialXrefs)
                        modelObjectModelMaterialXrefs = [];
                    modelObjectModelMaterialXrefs.push(modelObjectModelMaterialXref);
                }
            }
        }

        if (materials) {
            for (const material of materials) {
                idModelMaterial++;
                const modelMaterial: DBAPI.ModelMaterial = new DBAPI.ModelMaterial({
                    idModelMaterial,
                    Name: material?.name,
                });

                if (!modelMaterials)
                    modelMaterials = [];
                modelMaterials.push(modelMaterial);

                if (material.channels && isArray(material.channels)) {
                    for (const channel of material.channels) {
                        let materialType: string | null = null;
                        let materialTypeV: DBAPI.Vocabulary | undefined = undefined;
                        let UVMapEmbedded: boolean = false;
                        let materialUri: string | null = null;
                        let scalars: number[] | null | undefined = null;
                        const AddAttributes: string[] = [];

                        // iterate across object properties, extract those of interest; stuff the rest in AdditionalAttributes
                        for (const [key, value] of Object.entries(channel)) {
                            // LOG.logger.info(`JobCookSIPackratInspect.extract channel ${key}: ${JSON.stringify(value)}`);
                            switch (key) {
                                case 'type':
                                    materialType = maybeString(value);
                                    materialTypeV = materialType ? await CACHE.VocabularyCache.mapModelChannelMaterialType(materialType) : undefined;
                                    break;

                                case 'uri':
                                    materialUri = maybeString(value);
                                    if (materialUri) {
                                        // detect and handle UV Maps embedded in the geometry file:
                                        if (materialUri.toLowerCase().startsWith('embedded*')) {
                                            materialUri = null;
                                            UVMapEmbedded = true;
                                        }
                                    }
                                    break;

                                case 'value': {
                                    const materialValue: string | null = maybeString(value);
                                    scalars = materialValue?.replace(/ /g, '').split(',').map(x => +x);
                                    if (!scalars) {
                                        if (typeof(value) === 'number')
                                            scalars = [value];
                                    }
                                }   break;

                                default:
                                    AddAttributes.push(`${key}: ${JSON.stringify(value)}`);
                                    break;
                            }
                        }

                        let AdditionalAttributes: string | null = null;
                        if (AddAttributes.length > 0) {
                            AdditionalAttributes = '{ ';
                            for (const attribute of AddAttributes)
                                AdditionalAttributes += `${attribute},`;
                            AdditionalAttributes += ' }';
                        }

                        // record data needed for ModelMaterialUVMap and ModelAsset population
                        let idModelMaterialUVMapLookup: number | undefined = undefined;
                        if (materialUri) {
                            idModelMaterialUVMapLookup = modelMaterialUVMapIDs.get(materialUri);
                            if (!idModelMaterialUVMapLookup) {
                                idModelMaterialUVMapLookup = ++idModelMaterialUVMap;    // increment ID, needed in ModelMaterialChannel constructor below
                                modelMaterialUVMapIDs.set(materialUri, idModelMaterialUVMapLookup);
                            }

                            let channelList: string[] | undefined = modelMaterialChannelList.get(materialUri);
                            if (!channelList) {
                                channelList = [];
                                modelMaterialChannelList.set(materialUri, channelList);
                            }
                            if (materialType)
                                channelList.push(materialType);
                        }

                        idModelMaterialChannel++;
                        // TODO: deal with ChannelPosition and ChannelWidth once Cook's si-packrat-inspect can handle multi-channel textures
                        const modelMaterialChannel: DBAPI.ModelMaterialChannel = new DBAPI.ModelMaterialChannel({
                            idModelMaterialChannel,
                            idModelMaterial,
                            idVMaterialType: materialTypeV ? materialTypeV.idVocabulary : null,
                            MaterialTypeOther: materialTypeV ? null : materialType,
                            idModelMaterialUVMap: materialUri ? idModelMaterialUVMap : null,
                            UVMapEmbedded,
                            ChannelPosition: materialUri ? 0 : null,
                            ChannelWidth: materialUri ? 3 : null,
                            Scalar1: (scalars && scalars.length >= 1) ? scalars[0] : null,
                            Scalar2: (scalars && scalars.length >= 2) ? scalars[1] : null,
                            Scalar3: (scalars && scalars.length >= 3) ? scalars[2] : null,
                            Scalar4: (scalars && scalars.length >= 4) ? scalars[3] : null,
                            AdditionalAttributes
                        });

                        if (!modelMaterialChannels)
                            modelMaterialChannels = [];
                        modelMaterialChannels.push(modelMaterialChannel);
                    }
                }
            }
        }

        if (modelMaterialUVMapIDs.size > 0) {
            if (!modelMaterialUVMaps)
                modelMaterialUVMaps = [];
            if (!modelAssets)
                modelAssets = [];

            for (const [materialUri, idModelMaterialUVMapLookup] of modelMaterialUVMapIDs) {
                const channelList: string[] | null = modelMaterialChannelList.get(materialUri) || null;

                // Record ModelAsset for each UV Map
                modelAssets.push(JobCookSIPackratInspectOutput.createModelAsset(++idAsset, ++idAssetVersion, materialUri, false, channelList));

                // Record ModelMaterialUVMap for each UV Map
                modelMaterialUVMaps.push(JobCookSIPackratInspectOutput.createModelMaterialUVMap(idModelMaterialUVMapLookup, idModel, idAsset));
            }
        }

        JCOutput.modelConstellation = new DBAPI.ModelConstellation(model, modelObjects, modelMaterials,
            modelMaterialChannels, modelMaterialUVMaps, modelObjectModelMaterialXrefs, modelAssets);
        return JCOutput;
    }

    static async extractFromAssetVersion(idAssetVersion: number): Promise<JobCookSIPackratInspectOutput | null> {
        // find JobCook results for this asset version
        const idVJobType: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(CACHE.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        if (!idVJobType) {
            LOG.logger.error('JobCookSIPackratInspectOutput.extractFromAssetVersion failed: unable to compute Job ID of si-packrat-inspect');
            return null;
        }

        const jobRuns: DBAPI.JobRun[] | null = await DBAPI.JobRun.fetchMatching(1, idVJobType, DBAPI.eJobRunStatus.eDone, true, [idAssetVersion]);
        if (!jobRuns || jobRuns.length != 1) {
            LOG.logger.error(`JobCookSIPackratInspectOutput.extractFromAssetVersion failed: unable to compute Job Runs of si-packrat-inspect for asset version ${idAssetVersion}`);
            return null;
        }

        // Determine filename, file type, and date created by computing asset version:
        let fileName: string | null = null;
        let dateCreated: Date | null = null;
        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion);
        if (assetVersion) {
            fileName = assetVersion.FileName;
            dateCreated = assetVersion.DateCreated;
        } else
            LOG.logger.error(`JobCookSIPackratInspectOutput.extractFromAssetVersion unable to fetch assetVersion from ${idAssetVersion}`);

        let JCOutput: JobCookSIPackratInspectOutput | null = null;
        try {
            JCOutput = await JobCookSIPackratInspectOutput.extract(JSON.parse(jobRuns[0].Output || ''), fileName, dateCreated);
        } catch (error) {
            LOG.logger.error(`JobCookSIPackratInspectOutput.extractFromAssetVersion${JCOutput ? ' ' + JCOutput.error : ''}`, error);
            return null;
        }

        if (!JCOutput.success) {
            LOG.logger.error(`JobCookSIPackratInspectOutput.extractFromAssetVersion failed extracting job output [${JCOutput.error}]: ${jobRuns[0].Output}`);
            return null;
        }

        // LOG.logger.info(`GraphQL JobCookSIPackratInspectOutput.extractFromAssetVersion(${JSON.stringify(idAssetVersion)}) = ${JSON.stringify(JCOutput.modelConstellation, H.Helpers.stringifyCallbackCustom)}`);
        return JCOutput;
    }

    private static async createModel(idModel: number, modelStats: any | undefined,
        fileName: string | null = null, dateCreated: Date | null = null): Promise<DBAPI.Model> {

        // Compute FileType from file extension
        let vFileType: DBAPI.Vocabulary | undefined = undefined;
        if (fileName)
            vFileType = await CACHE.VocabularyCache.mapModelFileByExtension(fileName);
        // LOG.logger.info(`JobCookPackratInspect createModel ${fileName} -> ${JSON.stringify(vFileType)}`);
        return new DBAPI.Model({
            Name: fileName || '',
            Master: true,
            Authoritative: true,
            DateCreated: dateCreated || new Date(),
            idVCreationMethod: 0,
            idVModality: 0,
            idVUnits: 0,
            idVPurpose: 0,
            idVFileType: vFileType ? vFileType.idVocabulary : 0,
            idAssetThumbnail: null,
            CountAnimations: modelStats ? maybe<number>(modelStats?.numAnimations) : null,
            CountCameras: modelStats ? maybe<number>(modelStats?.numCameras) : null,
            CountFaces: modelStats ? maybe<number>(modelStats?.numFaces) : null,
            CountLights: modelStats ? maybe<number>(modelStats?.numLights) : null,
            CountMaterials: modelStats ? maybe<number>(modelStats?.numMaterials) : null,
            CountMeshes: modelStats ? maybe<number>(modelStats?.numMeshes) : null,
            CountVertices: modelStats ? maybe<number>(modelStats?.numVertices) : null,
            CountEmbeddedTextures: modelStats ? maybe<number>(modelStats?.numEmbeddedTextures) : null,
            CountLinkedTextures: modelStats ? maybe<number>(modelStats?.numLinkedTextures) : null,
            FileEncoding: modelStats ? maybe<string>(modelStats?.fileEncoding) : null,
            idModel
        });
    }

    private static createModelObject(idModelObject: number, idModel: number,
        JCBoundingBox: JobCookBoundingBox | null, JCStat: JobCookStatistics): DBAPI.ModelObject {
        return new DBAPI.ModelObject({
            idModelObject,
            idModel,
            BoundingBoxP1X: JCBoundingBox ? JCBoundingBox.min[0] : null,
            BoundingBoxP1Y: JCBoundingBox ? JCBoundingBox.min[1] : null,
            BoundingBoxP1Z: JCBoundingBox ? JCBoundingBox.min[2] : null,
            BoundingBoxP2X: JCBoundingBox ? JCBoundingBox.max[0] : null,
            BoundingBoxP2Y: JCBoundingBox ? JCBoundingBox.max[1] : null,
            BoundingBoxP2Z: JCBoundingBox ? JCBoundingBox.max[2] : null,
            CountVertices: JCStat.numVertices,
            CountFaces: JCStat.numFaces,
            CountColorChannels: JCStat.numColorChannels,
            CountTextureCoordinateChannels: JCStat.numTexCoordChannels,
            HasBones: JCStat.hasBones,
            HasFaceNormals: JCStat.hasNormals,
            HasTangents: JCStat.hasTangents,
            HasTextureCoordinates: JCStat.hasTexCoords,
            HasVertexNormals: JCStat.hasVertexNormals,
            HasVertexColor: JCStat.hasVertexColors,
            IsTwoManifoldUnbounded: JCStat.isTwoManifoldUnbounded,
            IsTwoManifoldBounded: JCStat.isTwoManifoldBounded,
            IsWatertight: JCStat.isWatertight,
            SelfIntersecting: JCStat.selfIntersecting,
        });
    }

    private static createModelMaterialUVMap(idModelMaterialUVMap: number, idModel: number, idAsset: number): DBAPI.ModelMaterialUVMap {
        return new DBAPI.ModelMaterialUVMap({
            idModel,
            idAsset,
            UVMapEdgeLength: 0,
            idModelMaterialUVMap,
        });
    }

    private static createModelAsset(idAsset: number, idAssetVersion: number, FileName: string,
        isModel: boolean, channelList: string[] | null): DBAPI.ModelAsset {
        const asset: DBAPI.Asset = new DBAPI.Asset({
            FileName,
            FilePath: '',
            idAssetGroup: null,
            idVAssetType: 0,
            idSystemObject: null,
            StorageKey: null,
            idAsset
        });
        const assetVersion: DBAPI.AssetVersion = new DBAPI.AssetVersion({
            idAsset,
            Version: 1,
            FileName,
            idUserCreator: 0,
            DateCreated: new Date(),
            StorageHash: '',
            StorageSize: BigInt(0),
            StorageKeyStaging: '',
            Ingested: false,
            BulkIngest: false,
            idAssetVersion
        });
        return new DBAPI.ModelAsset(asset, assetVersion, isModel, channelList);
    }
}

export class JobCookSIPackratInspect extends JobCook<JobCookSIPackratInspectParameters> {
    private parameters: JobCookSIPackratInspectParameters;

    constructor(jobEngine: JOB.IJobEngine, idAssetVersions: number[] | null,
        parameters: JobCookSIPackratInspectParameters, dbJobRun: DBAPI.JobRun) {
        super(jobEngine, Config.job.cookClientId, 'si-packrat-inspect',
            CookRecipe.getCookRecipeID('si-packrat-inspect', 'bb602690-76c9-11eb-9439-0242ac130002'),
            null, idAssetVersions, dbJobRun);
        this.parameters = parameters;
    }

    async cleanupJob(): Promise<H.IOResults> {
        return { success: true, error: '' };
    }

    protected async getParameters(): Promise<JobCookSIPackratInspectParameters> {
        // if asset is zipped, unzip the asset, seek geometry file, and then plan to stage that file using this._streamOverrideMap
        await this.testForZip();
        return this.parameters;
    }

    private async testForZip(): Promise<boolean> {
        if (path.extname(this.parameters.sourceMeshFile).toLowerCase() !== '.zip')
            return false;

        if (!this._idAssetVersions || this._idAssetVersions.length == 0)
            return false;

        const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersionByID(this._idAssetVersions[0]);
        if (!RSR.success || !RSR.readStream) {
            LOG.logger.error(`JobCookSIPackratInspect.testForZip unable to read asset version ${this._idAssetVersions[0]}: ${RSR.error}`);
            return false;
        }

        const ZS: ZipStream = new ZipStream(RSR.readStream);
        const zipRes: H.IOResults = await ZS.load();
        if (!zipRes.success) {
            LOG.logger.error(`JobCookSIPackratInspect.testForZip unable to read asset version ${this._idAssetVersions[0]}: ${zipRes.error}`);
            return false;
        }

        const files: string[] = await ZS.getJustFiles(null);
        for (const file of files) {
            if (await CACHE.VocabularyCache.mapModelFileByExtension(file) === undefined)
                continue;

            const readStream: NodeJS.ReadableStream | null = await ZS.streamContent(file);
            if (!readStream) {
                LOG.logger.error(`JobCookSIPackratInspect.testForZip unable to fetch read steram for ${file} in zip of idAssetVersion ${this._idAssetVersions[0]}`);
                return false;
            }

            this.parameters.sourceMeshFile = file;
            this._streamOverrideMap.set(this._idAssetVersions[0], {
                readStream,
                fileName: file,
                storageHash: null,
                success: true,
                error: ''
            });
            return true;
        }
        return false;
    }
}

