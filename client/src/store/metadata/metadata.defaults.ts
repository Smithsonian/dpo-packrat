/**
 * Metadata Store Defaults
 *
 * Default field definitions for the metadata store.
 */
import lodash from 'lodash';
import * as yup from 'yup';
import { ModelFields, OtherFields, PhotogrammetryFields, SceneFields, StateIdentifier } from './metadata.types';

const identifierWhenSelectedValidation = {
    is: true,
    then: yup.string().trim().required('Enter a valid identifier'),
    otherwise: yup.string().trim()
};

const identifierSchema = yup.object().shape({
    id: yup.number().required(),
    identifier: yup.string().trim().when('selected', identifierWhenSelectedValidation),
    identifierType: yup.number().nullable(true),
    selected: yup.boolean().required()
});

const folderSchema = yup.object().shape({
    id: yup.number().required(),
    name: yup.string().required(),
    variantType: yup.number().nullable(true)
});

const identifierValidation = {
    test: array => !!lodash.filter(array as StateIdentifier[], { selected: true }).length,
    message: 'Should select/provide at least 1 identifier'
};

const identifiersWhenValidation = {
    is: false,
    then: yup.array().of(identifierSchema).test(identifierValidation)
};

export const defaultPhotogrammetryFields: PhotogrammetryFields = {
    systemCreated: true,
    identifiers: [],
    folders: [],
    description: '',
    dateCaptured: new Date(),
    datasetType: null,
    datasetFieldId: null,
    itemPositionType: null,
    itemPositionFieldId: null,
    itemArrangementFieldId: null,
    focusType: null,
    lightsourceType: null,
    backgroundRemovalMethod: null,
    clusterType: null,
    clusterGeometryFieldId: null,
    cameraSettingUniform: false,
    directory: ''
};

export type PhotogrammetrySchemaType = typeof photogrammetryFieldsSchema;

export const photogrammetryFieldsSchema = yup.object().shape({
    systemCreated: yup.boolean().required(),
    identifiers: yup.array().of(identifierSchema).when('systemCreated', identifiersWhenValidation),
    folders: yup.array().of(folderSchema),
    description: yup.string().required('Description cannot be empty'),
    dateCaptured: yup.date().required(),
    datasetType: yup.number().typeError('Please select a valid dataset type'),
    datasetFieldId: yup.number().nullable(true),
    itemPositionType: yup.number().nullable(true),
    itemPositionFieldId: yup.number().nullable(true),
    itemArrangementFieldId: yup.number().nullable(true),
    focusType: yup.number().nullable(true),
    lightsourceType: yup.number().nullable(true),
    backgroundRemovalMethod: yup.number().nullable(true),
    clusterType: yup.number().nullable(true),
    clusterGeometryFieldId: yup.number().nullable(true),
    cameraSettingUniform: yup.boolean().required(),
    directory: yup.string()
});

const uvMapSchema = yup.object().shape({
    id: yup.number().required(),
    name: yup.string().required(),
    mapType: yup.number().nullable(true)
});

const sourceObjectSchema = yup.object().shape({
    idSystemObject: yup.number().required(),
    name: yup.string().required(),
    identifier: yup.string().required(),
    objectType: yup.number().required()
});

export const defaultModelFields: ModelFields = {
    systemCreated: true,
    identifiers: [],
    uvMaps: [],
    sourceObjects: [],
    dateCaptured: new Date(),
    creationMethod: null,
    master: false,
    authoritative: false,
    modality: null,
    units: null,
    purpose: null,
    modelFileType: null,
    roughness: null,
    metalness: null,
    pointCount: null,
    faceCount: null,
    isWatertight: null,
    hasNormals: null,
    hasVertexColor: null,
    hasUVSpace: null,
    boundingBoxP1X: null,
    boundingBoxP1Y: null,
    boundingBoxP1Z: null,
    boundingBoxP2X: null,
    boundingBoxP2Y: null,
    boundingBoxP2Z: null,
    directory: ''
};

export type ModelSchemaType = typeof modelFieldsSchema;

export const modelFieldsSchema = yup.object().shape({
    systemCreated: yup.boolean().required(),
    identifiers: yup.array().of(identifierSchema).when('systemCreated', identifiersWhenValidation),
    uvMaps: yup.array().of(uvMapSchema),
    sourceObjects: yup.array().of(sourceObjectSchema),
    dateCaptured: yup.date().typeError('Date Captured is required'),
    creationMethod: yup.number().typeError('Creation method is required'),
    master: yup.boolean().required(),
    authoritative: yup.boolean().required(),
    modality: yup.number().typeError('Modality is required'),
    units: yup.number().typeError('Units is required'),
    purpose: yup.number().typeError('Purpose is required'),
    modelFileType: yup.number().typeError('Model File Type is required'),
    roughness: yup.number().nullable(true),
    metalness: yup.number().nullable(true),
    pointCount: yup.number().nullable(true),
    faceCount: yup.number().nullable(true),
    isWatertight: yup.boolean().nullable(true),
    hasNormals: yup.boolean().nullable(true),
    hasVertexColor: yup.boolean().nullable(true),
    hasUVSpace: yup.boolean().nullable(true),
    boundingBoxP1X: yup.number().nullable(true),
    boundingBoxP1Y: yup.number().nullable(true),
    boundingBoxP1Z: yup.number().nullable(true),
    boundingBoxP2X: yup.number().nullable(true),
    boundingBoxP2Y: yup.number().nullable(true),
    boundingBoxP2Z: yup.number().nullable(true),
    directory: yup.string()
});

export const defaultSceneFields: SceneFields = {
    systemCreated: true,
    identifiers: [],
    referenceModels: []
};

export type SceneSchemaType = typeof sceneFieldsSchema;

export const referenceModelSchema = yup.object().shape({
    idSystemObject: yup.number().required(),
    name: yup.string().required(),
    fileSize: yup.number().required(),
    resolution: yup.number().nullable(true),
    boundingBoxP1X: yup.number().nullable(true),
    boundingBoxP1Y: yup.number().nullable(true),
    boundingBoxP1Z: yup.number().nullable(true),
    boundingBoxP2X: yup.number().nullable(true),
    boundingBoxP2Y: yup.number().nullable(true),
    boundingBoxP2Z: yup.number().nullable(true),
    action: yup.number().required()
});

export const sceneFieldsSchema = yup.object().shape({
    systemCreated: yup.boolean().required(),
    identifiers: yup.array().of(identifierSchema).when('systemCreated', identifiersWhenValidation),
    referenceModels: yup.array().of(referenceModelSchema)
});

export const defaultOtherFields: OtherFields = {
    systemCreated: true,
    identifiers: []
};

export type OtherSchemaType = typeof otherFieldsSchema;

export const otherFieldsSchema = yup.object().shape({
    systemCreated: yup.boolean().required(),
    identifiers: yup.array().of(identifierSchema).when('systemCreated', identifiersWhenValidation)
});

export type ValidateFieldsSchema = PhotogrammetrySchemaType | ModelSchemaType | SceneSchemaType | OtherSchemaType;
