/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import { JobCook } from './JobCook';
import { CookRecipe } from './CookRecipe';
import { Config } from '../../../config';

import * as JOB from '../../interface';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as STORE from '../../../storage/interface';
import * as REP from '../../../report/interface';
import * as H from '../../../utils/helpers';
import { eEventKey } from '../../../event/interface/EventEnums';
import { IZip } from '../../../utils/IZip';
import { ZipFile } from '../../../utils/zipFile';
import { maybe, maybeString } from '../../../utils/types';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

import { isArray } from 'lodash';
import * as path from 'path';
import { JobIOResults } from '../NS';

export class JobCookSIPackratInspectParameters {
    /** Specify sourceMeshStream when we have the stream for sourceMeshFile in hand (e.g. during upload fo a scene zip that contains this model) */
    constructor(sourceMeshFile: string, sourceMaterialFiles: string | undefined = undefined, sourceMeshStream: NodeJS.ReadableStream | undefined = undefined) {
        this.sourceMeshFile = path.basename(sourceMeshFile);
        this.sourceMaterialFiles = sourceMaterialFiles ? path.basename(sourceMaterialFiles) : undefined;
        this.sourceMeshStream = sourceMeshStream;
    }
    sourceMeshFile: string;
    sourceMaterialFiles?: string | undefined;
    sourceMeshStream?: NodeJS.ReadableStream | undefined;
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
    numTriangles: number | null = null;
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
        JCStat.numTriangles = maybe<number>(statistics?.numTriangles);
        JCStat.numVertices = maybe<number>(statistics?.numVertices);
        JCStat.numTexCoordChannels = maybe<number>(statistics?.numTexCoordChannels);
        JCStat.numColorChannels = maybe<number>(statistics?.numColorChannels);
        JCStat.hasNormals = H.Helpers.safeBoolean(statistics?.hasNormals);
        JCStat.hasVertexNormals = H.Helpers.safeBoolean(statistics?.hasVertexNormals);
        JCStat.hasVertexColors = H.Helpers.safeBoolean(statistics?.hasVertexColors);
        JCStat.hasTexCoords = H.Helpers.safeBoolean(statistics?.hasTexCoords);
        JCStat.hasBones = H.Helpers.safeBoolean(statistics?.hasBones);
        JCStat.hasTangents = H.Helpers.safeBoolean(statistics?.hasTangents);
        JCStat.isTwoManifoldUnbounded = H.Helpers.safeBoolean(statistics?.isTwoManifoldUnbounded);
        JCStat.isTwoManifoldBounded = H.Helpers.safeBoolean(statistics?.isTwoManifoldBounded);
        JCStat.selfIntersecting = H.Helpers.safeBoolean(statistics?.selfIntersecting);
        JCStat.isWatertight = H.Helpers.safeBoolean(statistics?.isWatertight);
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
     * @param assetMap Map of asset filename -> idAsset; if supplied, assets referenced but missing in this map will cause an error
     */
    async persist(idModel: number, assetMap?: Map<string, number> | undefined): Promise<H.IOResults> {
        if (!this.modelConstellation || !this.modelConstellation.Model || !this.modelConstellation.ModelObjects) {
            const error: string = 'Invalid JobCookSIPackratInspectOutput';
            RK.logError(RK.LogSection.eJOB,'persist failed',error,{ idModel },'Job.PackratInspect.Output');
            return { success: false, error };
        }

        const modelObjectIDMap: Map<number, number> = new Map<number, number>(); // map of fake id -> real id
        const modelMaterialIDMap: Map<number, number> = new Map<number, number>(); // map of fake id -> real id
        const modelMaterialUVMapIDMap: Map<number, number> = new Map<number, number>(); // map of fake id -> real id
        const assetIDMap: Map<number, number> = new Map<number, number>(); // map of fake id -> real id

        // if we're updating, grab the *current* model constellation, so that we can delete support records after persisting new records
        const origModelConstellation: DBAPI.ModelConstellation | null = (idModel > 0) ? await DBAPI.ModelConstellation.fetch(idModel) : null;

        // map and validate assets:
        if (assetMap && this.modelConstellation.ModelAssets) {
            for (const modelAsset of this.modelConstellation.ModelAssets) {
                const fileName: string = modelAsset.Asset.FileName.trim();
                let mappedId: number | undefined = assetMap.get(fileName);
                if (!mappedId) // try again, with just filename
                    mappedId = assetMap.get(path.basename(fileName));
                if (!mappedId) {
                    RK.logError(RK.LogSection.eJOB,'persist failed','missing filename from assetMap',{ fileName, idModel, assetMap },'Job.PackratInspect.Output');
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
                RK.logError(RK.LogSection.eJOB,'persist failed','failed to fetch model from DB',{ idModel },'Job.PackratInspect.Output');
                return { success: false, error };
            }

            const modelSource: DBAPI.Model = this.modelConstellation.Model;
            if (modelSource.CountAnimations !== null)
                model.CountAnimations = modelSource.CountAnimations;
            if (modelSource.CountCameras !== null)
                model.CountCameras = modelSource.CountCameras;
            if (modelSource.CountFaces !== null)
                model.CountFaces = modelSource.CountFaces;
            if (modelSource.CountTriangles !== null)
                model.CountTriangles = modelSource.CountTriangles;
            if (modelSource.CountLights !== null)
                model.CountLights = modelSource.CountLights;
            if (modelSource.CountMaterials !== null)
                model.CountMaterials = modelSource.CountMaterials;
            if (modelSource.CountMeshes !== null)
                model.CountMeshes = modelSource.CountMeshes;
            if (modelSource.CountVertices !== null)
                model.CountVertices = modelSource.CountVertices;
            if (modelSource.CountEmbeddedTextures !== null)
                model.CountEmbeddedTextures = modelSource.CountEmbeddedTextures;
            if (modelSource.CountLinkedTextures !== null)
                model.CountLinkedTextures = modelSource.CountLinkedTextures;
            if (modelSource.FileEncoding !== null)
                model.FileEncoding = modelSource.FileEncoding;
            if (modelSource.IsDracoCompressed != null)
                model.IsDracoCompressed = modelSource.IsDracoCompressed;

            model.Name = modelSource.Name;
            model.DateCreated = modelSource.DateCreated;
            if (modelSource.idVCreationMethod)
                model.idVCreationMethod = modelSource.idVCreationMethod;
            if (modelSource.idVModality)
                model.idVModality = modelSource.idVModality;
            if (modelSource.idVPurpose)
                model.idVPurpose = modelSource.idVPurpose;
            if (modelSource.idVUnits)
                model.idVUnits = modelSource.idVUnits;
            if (modelSource.idVFileType)
                model.idVFileType = modelSource.idVFileType;

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
                    RK.logError(RK.LogSection.eJOB,'persist failed','missing asset from map',{ idModel, idAsset: modelMaterialUVMap.idAsset },'Job.PackratInspect.Output');
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
                    RK.logError(RK.LogSection.eJOB,'persist failed','missing model material from ID map',{ idModel, idModelMaterial: modelMaterialChannel.idModelMaterial },'Job.PackratInspect.Output');
                    // return { success: false, error };
                    continue;
                }

                let mappedModelMaterialUVMapId: number | null | undefined = null;
                if (modelMaterialChannel.idModelMaterialUVMap) {
                    mappedModelMaterialUVMapId = modelMaterialUVMapIDMap.get(modelMaterialChannel.idModelMaterialUVMap);
                    if (!mappedModelMaterialUVMapId) {
                        RK.logError(RK.LogSection.eJOB,'persist failed','missing asset from model material UV ID map',{ idModel, idModelMaterialUVMap: modelMaterialChannel.idModelMaterialUVMap },'Job.PackratInspect.Output');
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
                    RK.logError(RK.LogSection.eJOB,'persist failed','missing asset from model material ID map',{ idModel, idModelMaterial: modelObjectModelMaterialXref.idModelMaterial },'Job.PackratInspect.Output');
                    // return { success: false, error };
                    continue;
                }

                const mappedModelObjectId: number | undefined = modelObjectIDMap.get(modelObjectModelMaterialXref.idModelObject);
                if (!mappedModelObjectId) {
                    RK.logError(RK.LogSection.eJOB,'persist failed','missing asset from model object ID map',{ idModel, idModelObject: modelObjectModelMaterialXref.idModelObject },'Job.PackratInspect.Output');
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

        if (origModelConstellation) {
            if (!await origModelConstellation.deleteSupportObjects())
                RK.logError(RK.LogSection.eJOB,'persist failed','unable to delete original model support objects',{ idModel, origModelConstellation },'Job.PackratInspect.Output');
        }

        // Send audit update for model, now that we've finished writing dependent objects, to help ensure full indexing of this model
        await this.modelConstellation.Model.audit(eEventKey.eDBUpdate);
        return { success: true };
    }

    static async extract(output: any, fileName: string | null, dateCreated: Date | null): Promise<JobCookSIPackratInspectOutput> {
        const JCOutput: JobCookSIPackratInspectOutput = await JobCookSIPackratInspectOutput.extractWorker(output, fileName, dateCreated);
        const report: REP.IReport | null = await REP.ReportFactory.getReport();
        if (report)
            report.append(`Cook si-packrat-inspect ${JCOutput.success ? 'succeeded' : 'failed: ' + JCOutput.error}`);
        return JCOutput;
    }

    private static async extractWorker(output: any, fileName: string | null, dateCreated: Date | null): Promise<JobCookSIPackratInspectOutput> {
        // LOG.info(`JobCookSIPackratInspectOutput.extract: ${JSON.stringify(output, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eJOB);
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

        // if we have merged reports (legacy inspection) use it, otherwise use the 'inspect-mesh' stage
        // const mergeReport: any = steps ? steps['merge-reports'] : undefined;
        const mergeReport: any = steps?.['merge-reports'] ?? steps?.['inspect-mesh'];

        // extract meaningful sections of the report for analysis
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

        const model: DBAPI.Model = await JobCookSIPackratInspectOutput.createModel(++idModel, modelStats, sourceMeshFile ? sourceMeshFile : fileName, dateCreated);
        // LOG.info(`JobCookSIPackratInspectOutput.extract model: ${JSON.stringify(model, H.Helpers.saferStringify)} from stats ${JSON.stringify(modelStats)}`, LOG.LS.eJOB);

        if (sourceMeshFile) {
            if (!modelAssets)
                modelAssets = [];
            modelAssets.push(JobCookSIPackratInspectOutput.createModelAsset(++idAsset, ++idAssetVersion, sourceMeshFile, true, null));
        }

        for (const mesh of meshes) {
            idModelObject++;
            const statistics: any = mesh.statistics;
            if (!statistics) {
                RK.logError(RK.LogSection.eJOB,'extract wroker failed',`missing steps['merge-reports'].result.inspection.meshes[${idModelObject - 1}].statistics`,{ idModel, output },'Job.PackratInspect.Output');
                continue;
            }

            const boundingBox: any = mesh.geometry?.boundingBox;
            const JCBoundingBox: JobCookBoundingBox | null = JobCookBoundingBox.extract(boundingBox);
            const JCStat: JobCookStatistics = JobCookStatistics.extract(statistics);

            const modelObject: DBAPI.ModelObject = JobCookSIPackratInspectOutput.createModelObject(idModelObject, idModel, JCBoundingBox, JCStat);
            modelObjects.push(modelObject);
            // LOG.info(`JobCookSIPackratInspectOutput.extract model object: ${JSON.stringify(modelObject, H.Helpers.saferStringify)} mesh stats: ${JSON.stringify(JCStat)}`, LOG.LS.eJOB);

            // ModelObjectModelMaterialXref
            if (JCStat.materialIndex) {
                for (const materialIndex of JCStat.materialIndex) { // 0-based index
                    // validate materialIndex for our material array
                    if ((materialIndex + 1) > materialCount) {
                        JCOutput.success = false;
                        JCOutput.error = `Invalid materialIndex ${materialIndex}`;
                        RK.logError(RK.LogSection.eJOB,'extract wroker failed',JCOutput.error,{ idModel },'Job.PackratInspect.Output');
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
                            // LOG.info(`JobCookSIPackratInspect.extract channel ${key}: ${JSON.stringify(value)}`, LOG.LS.eJOB);
                            switch (key) {
                                case 'type':
                                    materialType = maybeString(value);
                                    materialTypeV = materialType ? await CACHE.VocabularyCache.mapModelChannelMaterialType(materialType) : undefined;
                                    break;

                                case 'uri':
                                    materialUri = maybeString(value);
                                    if (materialUri) {
                                        materialUri = materialUri.trim();
                                        // detect and handle UV Maps embedded in the geometry file:
                                        if (isEmbeddedTexture(materialUri)) {
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

                        // Restored 1/25/2023 based on team feedback // As of 4/13/2021, Packrat will ignore Material Channels reported by Cook that do not reference UV Maps
                        // if (!materialUri && !UVMapEmbedded)
                        //     continue;

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
                        // Stuff extra data for use within GraphQL's getModelConstellationForAssetVersion
                        // That method wants to compute "Source" using information derived from database IDs
                        // But the DB IDs here are artificial. So use this placeholder for the time being
                        if (materialUri)
                            modelMaterialChannel['Source'] = materialUri;

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

    static async extractJobRunFromAssetVersion(idAssetVersion: number, sourceMeshFile?: string | undefined): Promise<DBAPI.JobRun | null> {
        // find JobCook results for this asset version
        const idVJobType: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect);
        if (!idVJobType) {
            RK.logError(RK.LogSection.eJOB,'extract job run failed','unable to compute Job ID of si-packrat-inspect',{ idVJobType, idAssetVersion, sourceMeshFile },'Job.PackratInspect.Output');
            return null;
        }

        const jobRuns: DBAPI.JobRun[] | null = await DBAPI.JobRun.fetchMatching(1, idVJobType, COMMON.eWorkflowJobRunStatus.eDone, true, [idAssetVersion], sourceMeshFile);
        if (!jobRuns || jobRuns.length != 1) {
            RK.logError(RK.LogSection.eJOB,'extract job run failed','unable to compute Job Runs of si-packrat-inspect for asset version',{ idVJobType, idAssetVersion, sourceMeshFile },'Job.PackratInspect.Output');
            return null;
        }
        return jobRuns[0];
    }

    static async extractFromAssetVersion(idAssetVersion: number, sourceMeshFile?: string | undefined): Promise<JobCookSIPackratInspectOutput | null> {

        // grab the JobRun from the upload/inspection of the provided mesh file. This
        // is used to extract additional material properties from the returned Cook report
        const jobRun: DBAPI.JobRun | null = await JobCookSIPackratInspectOutput.extractJobRunFromAssetVersion(idAssetVersion, sourceMeshFile);
        if (!jobRun)
            return null;

        // Determine filename, file type, and date created by computing asset version:
        let fileName: string | null = null;
        let dateCreated: Date | null = null;
        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion);
        if (assetVersion) {
            fileName = assetVersion.FileName;
            dateCreated = assetVersion.DateCreated;
        } else
            RK.logError(RK.LogSection.eJOB,'extract job output failed','unable to fetch assetVersion',{ idAssetVersion },'Job.PackratInspect.Output');

        let JCOutput: JobCookSIPackratInspectOutput | null = null;
        try {
            JCOutput = await JobCookSIPackratInspectOutput.extract(JSON.parse(jobRun.Output || ''), fileName, dateCreated);
        } catch (error) {
            RK.logError(RK.LogSection.eJOB,'extract job output failed',`error extracting: ${error}`,{ idAssetVersion, sourceMeshFile },'Job.PackratInspect.Output');
            return null;
        }

        if (!JCOutput.success) {
            RK.logError(RK.LogSection.eJOB,'extract job output failed',`failed extracting job output: ${JCOutput.error}`,{ idAssetVersion, sourceMeshFile },'Job.PackratInspect.Output');
            return null;
        }

        return JCOutput;
    }

    private static async createModel(idModel: number, modelStats: any | undefined,
        fileName: string | null = null, dateCreated: Date | null = null): Promise<DBAPI.Model> {

        // Compute FileType from file extension
        let vFileType: DBAPI.Vocabulary | undefined = undefined;
        if (fileName)
            vFileType = await CACHE.VocabularyCache.mapModelFileByExtension(fileName);

        // LOG.info(`JobCookPackratInspect createModel ${fileName} -> ${JSON.stringify(vFileType)}`, LOG.LS.eJOB);
        return new DBAPI.Model({
            Name: fileName || '',
            Title: '', // FIXME
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
            IsDracoCompressed: modelStats ? H.Helpers.safeBoolean(modelStats?.isDracoCompressed) : null,
            AutomationTag: null,
            CountTriangles: modelStats ? maybe<number>(modelStats?.numTriangles) : null,
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
            CountTriangles: JCStat.numTriangles,
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
            idAssetGroup: null,
            idVAssetType: 0,
            idSystemObject: null,
            StorageKey: null,
            idAsset
        });
        const assetVersion: DBAPI.AssetVersion = new DBAPI.AssetVersion({
            idAsset,
            Version: 0,
            FileName,
            idUserCreator: 0,
            DateCreated: new Date(),
            StorageHash: '',
            StorageSize: BigInt(0),
            StorageKeyStaging: '',
            Ingested: null,
            BulkIngest: false,
            idSOAttachment: null,
            FilePath: '',
            Comment: 'Created by Cook si-packrat-inspect',
            idAssetVersion
        });
        return new DBAPI.ModelAsset(asset, assetVersion, isModel, channelList);
    }
}

export class JobCookSIPackratInspect extends JobCook<JobCookSIPackratInspectParameters> {
    private parameters: JobCookSIPackratInspectParameters;
    private sourceMeshStream: NodeJS.ReadableStream | undefined;
    private tempFilePath: string | undefined = undefined;

    constructor(jobEngine: JOB.IJobEngine, idAssetVersions: number[] | null, report: REP.IReport | null,
        parameters: JobCookSIPackratInspectParameters, dbJobRun: DBAPI.JobRun) {
        super(jobEngine, Config.job.cookClientId, 'si-packrat-inspect',
            CookRecipe.getCookRecipeID('si-packrat-inspect', 'bb602690-76c9-11eb-9439-0242ac130002'),
            null, idAssetVersions, report, dbJobRun);
        if (parameters.sourceMeshStream) {
            this.sourceMeshStream = parameters.sourceMeshStream;
            delete parameters.sourceMeshStream; // strip this out, as Cook will choke on it!
        } else
            this.sourceMeshStream = undefined;

        this.parameters = parameters;
    }

    async cleanupJob(): Promise<H.IOResults> {
        // if we have a temp file path, see if it exists, and clean it up.
        if(this.tempFilePath) {
            RK.logDebug(RK.LogSection.eJOB,'cleanup job','removing temp file',{ path: this.tempFilePath, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
            await H.Helpers.removeFile(this.tempFilePath);
            this.tempFilePath = undefined;
        }

        return { success: true };
    }

    protected async getParameters(): Promise<JobCookSIPackratInspectParameters> {
        // if asset is zipped, unzip the asset, seek geometry file, and then plan to stage that file using this._streamOverrideMap
        await this.testForZipOrStream();
        return this.parameters;
    }

    private async testForZipOrStream(): Promise<boolean> {
        if (!this._idAssetVersions || this._idAssetVersions.length == 0)
            return false;
        // LOG.info(`JobCookSIPackratInspect.testForZipOrStream AssetVersion IDs ${H.Helpers.JSONStringify(this._idAssetVersions)}`, LOG.LS.eJOB);

        // if we've been handed a stream to act on it ... do so!
        if (this.sourceMeshStream) {
            // LOG.info('JobCookSIPackratInspect.testForZipOrStream processing stream', LOG.LS.eJOB);
            const RSRs: STORE.ReadStreamResult[] = [{
                readStream: this.sourceMeshStream,
                fileName: this.parameters.sourceMeshFile,
                storageHash: null,
                success: true
            }];
            this._streamOverrideMap.set(this._idAssetVersions[0], RSRs);
            return true;
        }

        // LOG.info(`JobCookSIPackratInspect.testForZipOrStream parameters ${H.Helpers.JSONStringify(this.parameters)}`, LOG.LS.eJOB);
        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(this._idAssetVersions[0]);
        if (!assetVersion) {
            RK.logError(RK.LogSection.eJOB,'test for zip failed','unable to fetch asset version',{ idAssetVersions: this._idAssetVersions, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
            return false;
        }

        if (!assetVersion.FileName || path.extname(assetVersion.FileName).toLowerCase() !== '.zip') {
            // LOG.info(`JobCookSIPackratInspect.testForZipOrStream processing non-zip file ${RSR.fileName}`, LOG.LS.eJOB);
            RK.logWarning(RK.LogSection.eJOB,'test for zip failed','processing non-zip file',{ fileName: assetVersion.FileName, idAssetVersions: this._idAssetVersions, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
            return false;
        }

        const ZS: IZip | null = await this.fetchZip(assetVersion);
        if (!ZS) {
            RK.logError(RK.LogSection.eJOB,'test for zip failed','cannot fetch zip from AssetVersion',{ fileName: assetVersion.FileName, idAssetVersion: assetVersion.idAssetVersion, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
            return false;
        }

        const zipRes: H.IOResults = await ZS.load();
        if (!zipRes.success) {
            RK.logError(RK.LogSection.eJOB,'test for zip failed',`unable to load zip for AssetVersion: ${zipRes.error}`,{ fileName: assetVersion.FileName, idAssetVersion: assetVersion.idAssetVersion, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
            return false;
        }

        // grab our list of files in the ZIP and cycle through each streaming them in
        let sourceMeshFile: string | undefined = undefined;
        const files: string[] = await ZS.getJustFiles(null);
        const RSRs: STORE.ReadStreamResult[] = [];
        RK.logDebug(RK.LogSection.eJOB,'test for zip','processing files in zip',{ files, idAssetVersions: assetVersion.idAssetVersion, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');

        for (const file of files) {
            // figure out our type based on the file's extension
            const eVocabID: COMMON.eVocabularyID | undefined = CACHE.VocabularyCache.mapModelFileByExtensionID(file);
            const extension: string = path.extname(file).toLowerCase() || file.toLowerCase();
            RK.logDebug(RK.LogSection.eJOB,'test for zip','considering zip file entry',{ file, extension, idVocab: eVocabID ? COMMON.eVocabularyID[eVocabID] : 'undefined', idAssetVersions: assetVersion.idAssetVersion, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');

            // ignoring image types
            const imageTypes: string[] = [ '.jpg','.jpeg','.png','.bmp','.tga','.tif','.tiff' ];
            if(imageTypes.includes(extension))
                continue;
            
            // for the time being, only handle model geometry files, OBJ .mtl files, and GLTF .bin files
            if (eVocabID === undefined && extension !== '.mtl' && extension !== '.bin') {
                RK.logWarning(RK.LogSection.eJOB,'test for zip','not model geometry file',{ file,extension, idAssetVersions: assetVersion.idAssetVersion, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
                continue;
            }

            // stream our content in
            const readStream: NodeJS.ReadableStream | null = await ZS.streamContent(file);
            if (!readStream) {
                RK.logError(RK.LogSection.eJOB,'test for zip failed','unable to fetch read steram for file in zip of idAssetVersion',{ file, idAssetVersions: assetVersion.idAssetVersion, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
                return false;
            }

            // store the stream for later reference
            // RK.logInfo(RK.LogSection.eJOB,'test for zip','creating stream override for zip file entry',{ file, idAssetVersions: assetVersion.idAssetVersion, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
            RSRs.push({
                readStream,
                fileName: file,
                storageHash: null,
                success: true
            });

            // If we haven't yet defined the source mesh and we are processing a geometry file (eVocabID is defined), use this file as our source mesh:
            // TEST: multiple models in the same zip. may need validation/rejection to avoid confusion
            if (!sourceMeshFile && eVocabID !== undefined)
                sourceMeshFile = path.basename(file);
        }

        // if we found a mesh file to use as the source we update or JobRun in the db so it knows about it
        // when feeding parameters to the Cook recipe.
        if (sourceMeshFile) {
            this.parameters.sourceMeshFile = sourceMeshFile;
            this._dbJobRun.Parameters = JSON.stringify(this.parameters, H.Helpers.saferStringify);
            if (!await this._dbJobRun.update())
                RK.logError(RK.LogSection.eJOB,'test for zip failed','failed to update JobRun.parameters',{ sourceMeshFile, dbJobRun: this._dbJobRun, idAssetVersion: assetVersion.idAssetVersion, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
        }

        // if we have at least one stream store them in our overrideMap, which is used to keep track of
        // streams/files for processing
        if (RSRs.length > 0) {
            RK.logInfo(RK.LogSection.eJOB,'test for zip success','recording stream override for idAssetVersion',{ idAssetVersion: assetVersion.idAssetVersion, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, RSRs },'Job.PackratInspect');
            this._streamOverrideMap.set(this._idAssetVersions[0], RSRs);
            return true;
        }

        // no streams found so we return
        RK.logWarning(RK.LogSection.eJOB,'test for zip failed','no streams found',{ fileName: assetVersion.FileName, idAssetVersion: assetVersion.idAssetVersion, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
        return false;
    }

    private async fetchZip(assetVersion: DBAPI.AssetVersion): Promise<IZip | null> {

        const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersionByID(assetVersion.idAssetVersion);
        if (!RSR.success || !RSR.readStream || !RSR.fileName) {
            RK.logError(RK.LogSection.eJOB,'fetch zip failed',`unable to read asset version: ${RSR.error}`,{ fileName: assetVersion.FileName, idAssetVersions: assetVersion.idAssetVersion, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
            return null;
        }

        RK.logDebug(RK.LogSection.eJOB,'fetch zip','processing zip file',{ fileName: assetVersion.FileName, idAssetVersions: assetVersion.idAssetVersion, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');

        // copy our zip locally so that we can avoid loading the full zip into memory and use ZipFile
        // This also avoids an issue we're experiencing (as of 8/1/2022) with JSZip not emitting "end" events
        // when we've fully read a (very large) zip entry with its nodeStream method

        // if we have a temp file already, destroy it.
        if(this.tempFilePath) {
            await H.Helpers.removeFile(this.tempFilePath);
            this.tempFilePath = undefined;
        }

        // construct our full path with a random filename to avoid collisions
        // and then write our stream to that location.
        this.tempFilePath = path.join(Config.storage.rootStaging,'tmp', H.Helpers.randomFilename('',RSR.fileName));
        try {
            const res: H.IOResults = await H.Helpers.writeStreamToFile(RSR.readStream, this.tempFilePath);
            if (!res.success) {
                RK.logError(RK.LogSection.eJOB,'fetch zip failed',`unable to copy asset version: ${res.error}`,{ fileName: assetVersion.FileName, idAssetVersions: assetVersion.idAssetVersion, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
                return null;
            }

            RK.logDebug(RK.LogSection.eJOB,'fetch zip','stream stored to disk',{ tempPath: this.tempFilePath, fileName: assetVersion.FileName, idAssetVersions: assetVersion.idAssetVersion, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
            return new ZipFile(this.tempFilePath);
        } catch (err) {
            RK.logError(RK.LogSection.eJOB,'fetch zip failed',`unable to copy asset version locally to temp path: ${err}`,{ tempPath: this.tempFilePath, fileName: assetVersion.FileName, idAssetVersions: assetVersion.idAssetVersion, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
            return null;
        }
    }

    protected async verifyRequest(): Promise<JobIOResults> {
        const superResult: JobIOResults = await super.verifyRequest();
        if(superResult.success===false) {
            RK.logError(RK.LogSection.eJOB,'verify request failed',`request is invalid: ${superResult.error}`,{ sourceMeshFile: this.parameters.sourceMeshFile, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
            this.appendToReportAndLog(`[CookJob:Inspection] request is invalid. ${superResult.error} (${this.parameters.sourceMeshFile})`);
            return superResult;
        }

        // get our parameters and see if sending a zip (a symptom of failed zip processing)
        // const fileExtension: string = path.extname(this.parameters.sourceMeshFile);
        // if(fileExtension==='zip') {
        //     this.appendToReportAndLog(`[CookJob:Inspection] request is invalid. failed to prep file. trying to send Zip. (${this.parameters.sourceMeshFile})`);
        //     return { success: false, error: `failed to prep file (${this.parameters.sourceMeshFile})`, allowRetry: false };
        // }

        // we're good to continue
        RK.logDebug(RK.LogSection.eJOB,'verify request success','request is valid. sending to Cook...',{ sourceMeshFile: this.parameters.sourceMeshFile, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
        this.appendToReportAndLog(`[CookJob:Inspection] request is valid. sending to Cook... (${this.parameters.sourceMeshFile})`);
        return { success: true, allowRetry: false };
    }

    protected async verifyResponse(cookJobReport: any): Promise<JobIOResults> {

        const logContains = (logs: any, searchString: string): boolean => {
            return logs.some(entry => entry.message.includes(searchString));
        };

        // make sure we have logs. we use 'inspect-mesh' even for legacy since legacy 'merged-reports'
        // does not consolidate the log messages.
        if(!cookJobReport.steps['inspect-mesh'] || !cookJobReport.steps['inspect-mesh'].log) {
            RK.logError(RK.LogSection.eJOB,'verify response failed','response is invalid: missing inspect-mesh and/or log objects',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
            this.appendToReportAndLog('[CookJob:Inspection] response is invalid. missing inspect-mesh and/or log objects');
            return { success: false, error: 'missing log objects in Cook report', allowRetry: false };
        }
        const logs = cookJobReport.steps['inspect-mesh'].log;

        // make sure our base/super routine doesn't have anything to report
        const superResult: JobIOResults = await super.verifyResponse(cookJobReport);
        if(superResult.success===false) {
            // check for known issues and improve error message returned
            if(superResult.error?.includes('Tool Blender: terminated with code: 1')===true) {
                if(logContains(logs,'Error: Unsupported file type: .zip')===true)
                    superResult.error = 'Zip package is invalid/corrupt.';
                else
                    superResult.error = 'Unknown Blender error. Check report.';
            }
            if(superResult.error?.includes('Tool MeshSmith: terminated with code: 1')===true) {
                if(logContains(logs,'Invalid vertex index')===true)
                    superResult.error = 'Invalid mesh. Missing vertices/faces.';
                else
                    superResult.error = 'Unknown MeshSmith error. Check report.';
            }

            RK.logError(RK.LogSection.eJOB,'verify response failed',`response is invalid: ${superResult.error}`,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
            this.appendToReportAndLog(`[CookJob:Inspection] response is invalid. ${superResult.error}`);
            return superResult;
        }

        // check for ZIP processing errors
        if(logContains(logs,'Error: Unsupported file type: .zip')===true) {
            RK.logError(RK.LogSection.eJOB,'verify response failed','response is invalid: Zip package incomplete or corrupt.',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
            this.appendToReportAndLog('[CookJob:Inspection] response is invalid. Zip package incomplete or corrupt.');
            return { success: false, error: 'Zip package incomplete or corrupt.', allowRetry: false };
        }

        // get our 'root' for properties supporting legacy and modern inspection reports for stats
        const inspectionRoot: any = cookJobReport.steps?.['merged-reports'] ?? cookJobReport.steps?.['inspect-mesh']?.result?.inspection;

        // check for missing material
        if(inspectionRoot?.scene?.materials?.length>0) {
            const errors: string[] = inspectionRoot.scene.materials
                .filter(m => m.error)   // Keep only items that have an error
                .map(m => 'material ' + m.error);     // extract the error

            if(errors.length>0) {
                const errorMsg = errors.join(' | ');
                RK.logError(RK.LogSection.eJOB,'verify response failed',`response is invalid: ${errorMsg}`,{  jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, inspectionRoot },'Job.PackratInspect');
                this.appendToReportAndLog(`[CookJob:Inspection] response is invalid: ${errorMsg}`);
                return { success: false, error: errorMsg, allowRetry: false };
            }
        }

        // get our geometry results
        if (!inspectionRoot?.meshes) {
            RK.logError(RK.LogSection.eJOB,'verify response failed','response is invalid: Missing meshes in inspection result.',{  jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, inspectionRoot },'Job.PackratInspect');
            this.appendToReportAndLog('[CookJob:Inspection] response is invalid. Missing meshes in inspection result.');
            return { success: false, error: 'Missing meshes in Cook report', allowRetry: false };
        }

        // check for invalid bounding box
        const sizeSum = inspectionRoot.scene.geometry.size.reduce((acc, num) => acc + num, 0);
        if(sizeSum <= 0) {
            RK.logError(RK.LogSection.eJOB,'verify response failed','response is invalid: Mesh size is zero.',{  jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, inspectionRoot },'Job.PackratInspect');
            this.appendToReportAndLog('[CookJob:Inspection] response is invalid. Mesh size is zero.');
            return { success: false, error: 'Invalid mesh. Size is zero.', allowRetry: false };
        }

        // check for invalid geometry counts
        if(inspectionRoot.scene.statistics.numFaces<=0 || inspectionRoot.scene.statistics.numVertices<=0 || inspectionRoot.scene.statistics.numEdges<=0 || inspectionRoot.scene.statistics.numTriangles<=0 || logContains(logs,'Invalid vertex index')===true) {
            RK.logError(RK.LogSection.eJOB,'verify response failed','response is invalid: Mesh missing vertices and/or faces.',{  jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, inspectionRoot },'Job.PackratInspect');
            this.appendToReportAndLog('[CookJob:Inspection] response is invalid. Mesh missing vertices and/or faces.');
            return { success: false, error: 'Invalid mesh. Missing vertices/faces.', allowRetry: false };
        }
        if(logContains(logs,'Invalid vertex index')===true) {
            RK.logError(RK.LogSection.eJOB,'verify response failed','response is invalid: Mesh size is zero.',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.PackratInspect');
            this.appendToReportAndLog('[CookJob:Inspection] response is invalid: Missing vertices/faces.');
            return { success: false, error: 'Invalid mesh. Missing vertices/faces.', allowRetry: false };
        }

        // missing textures, UVs, etc.
        if(inspectionRoot.scene.statistics.numLinkedTextures > 0 || inspectionRoot.scene.statistics.numEmbeddedTextures > 0) {
            // NOTE: just looking at first mesh. multi-model inspection will need special handling
            if(inspectionRoot.meshes[0].statistics.hasTexCoords===false) {
                RK.logError(RK.LogSection.eJOB,'verify response failed','response is invalid: Mesh missing UVs for included texture.',{  jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, ...inspectionRoot.scene.statistics },'Job.PackratInspect');
                this.appendToReportAndLog('[CookJob:Inspection] response is invalid. Mesh missing UVs for included texture.');
                return { success: false, error: 'Invalid mesh. Missing UVs for included texture.', allowRetry: false };
            }
        }

        // we have success
        await this.recordSuccess(JSON.stringify(cookJobReport));
        return { success: true, allowRetry: false };
    }
}

const EMBEDDED_TEXTURE_PREFIX: string = 'embedded*';
export function isEmbeddedTexture(uri: string): boolean {
    const uriNorm: string = uri.toLowerCase();
    const fileName: string = path.basename(uriNorm);
    return uriNorm.startsWith(EMBEDDED_TEXTURE_PREFIX) || fileName.startsWith(EMBEDDED_TEXTURE_PREFIX);
}
