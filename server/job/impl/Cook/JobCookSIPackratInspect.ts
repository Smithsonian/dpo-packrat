/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import { JobCook } from './JobCook';
import { CookRecipe } from './CookRecipe';
import { Config } from '../../../config';

import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as H from '../../../utils/helpers';
import { maybe, maybeString } from '../../../utils/types';
import { isArray } from 'lodash';

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
    modelObjects: DBAPI.ModelObject[] = [];
    modelMetrics: DBAPI.ModelMetrics[] = [];
    modelMaterials: DBAPI.ModelMaterial[] | null = null;
    modelMaterialChannels: DBAPI.ModelMaterialChannel[] | null = null;
    uvMaps: Map<number, string> = new Map<number, string>();    // map of 'fake' idModelMaterialUVMap (referenced in modelMaterialChannels) to URI of UV Map
    // modelMaterialUVMaps: DBAPI.ModelMaterialUVMap[] | null = null;

    static async extract(output: any): Promise<JobCookSIPackratInspectOutput> {
        const JCOutput: JobCookSIPackratInspectOutput = new JobCookSIPackratInspectOutput();

        const steps: any = output?.steps;
        const mergeReport: any = steps ? steps['merge-reports'] : undefined;
        const inspection: any = mergeReport?.result?.inspection;
        const meshes: any[] | undefined = inspection?.meshes;
        const materials: any[] | undefined = inspection?.scene?.materials;
        if (!meshes) {
            JCOutput.success = false;
            JCOutput.error = 'Job output is missing mesh detail';
            return JCOutput;
        }

        let idModelObject: number = 0;
        let idModelMetrics: number = 0;
        let idModelMaterial: number = 0;
        let idModelMaterialUVMap: number = 0;
        let idModelMaterialChannel: number = 0;

        for (const mesh of meshes) {
            idModelObject++;
            const statistics: any = mesh.statistics;
            if (!statistics) {
                LOG.logger.error(`JobCookSIPackratInspectOutput.extract missing steps['merge-reports'].result.inspection.meshes[${idModelObject = 1}].statistics: ${JSON.stringify(output)}`);
                continue;
            }

            idModelMetrics++;
            const boundingBox: any = mesh.geometry?.boundingBox;
            const JCBoundingBox: JobCookBoundingBox | null = JobCookBoundingBox.extract(boundingBox);
            const JCStat: JobCookStatistics = JobCookStatistics.extract(statistics);
            // TODO: Verify types; deal with booleans vs 'false' / 'true'
            const modelMetric: DBAPI.ModelMetrics = new DBAPI.ModelMetrics({
                idModelMetrics,
                BoundingBoxP1X: JCBoundingBox ? JCBoundingBox.min[0] : null,
                BoundingBoxP1Y: JCBoundingBox ? JCBoundingBox.min[1] : null,
                BoundingBoxP1Z: JCBoundingBox ? JCBoundingBox.min[2] : null,
                BoundingBoxP2X: JCBoundingBox ? JCBoundingBox.max[0] : null,
                BoundingBoxP2Y: JCBoundingBox ? JCBoundingBox.max[1] : null,
                BoundingBoxP2Z: JCBoundingBox ? JCBoundingBox.max[2] : null,
                CountPoint: JCStat.numVertices,
                CountFace: JCStat.numFaces,
                CountColorChannel: JCStat.numColorChannels,
                CountTextureCoorinateChannel: JCStat.numTexCoordChannels,
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

            JCOutput.modelObjects.push(new DBAPI.ModelObject({
                idModelObject,
                idModel: 0,
                idModelMetrics
            }));

            JCOutput.modelMetrics.push(modelMetric);
        }

        if (materials) {
            for (const material of materials) {
                idModelMaterial++;
                const modelMaterial: DBAPI.ModelMaterial = new DBAPI.ModelMaterial({
                    idModelMaterial,
                    idModelObject,
                    Name: material?.name,
                });

                if (!JCOutput.modelMaterials)
                    JCOutput.modelMaterials = [];
                JCOutput.modelMaterials.push(modelMaterial);

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
                                        } else
                                            JCOutput.uvMaps.set(++idModelMaterialUVMap, materialUri);
                                    }
                                    break;

                                case 'value': {
                                    const materialValue: string | null = maybeString(value);
                                    scalars = materialValue?.replace(/ /g, '').split(',').map(x => +x);
                                    if (!scalars) {
                                        if (typeof(channel?.value) === 'number')
                                            scalars = [channel.value];
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

                        if (!JCOutput.modelMaterialChannels)
                            JCOutput.modelMaterialChannels = [];
                        JCOutput.modelMaterialChannels.push(modelMaterialChannel);
                    }
                }
            }
        }
        return JCOutput;
    }
}

export class JobCookSIPackratInspect extends JobCook<JobCookSIPackratInspectParameters> {
    private parameters: JobCookSIPackratInspectParameters;

    constructor(idAssetVersions: number[] | null, parameters: JobCookSIPackratInspectParameters, dbJobRun: DBAPI.JobRun) {
        super(Config.job.cookClientId, 'si-packrat-inspect',
            CookRecipe.getCookRecipeID('si-packrat-inspect', 'bb602690-76c9-11eb-9439-0242ac130002'),
            null, idAssetVersions, dbJobRun);
        this.parameters = parameters;
    }

    protected getParameters(): JobCookSIPackratInspectParameters {
        return this.parameters;
    }
}

