/**
 * Metadata Store Defaults
 *
 * Default field definitions for the metadata store.
 */
import * as yup from 'yup';
import { ModelFields, OtherFields, PhotogrammetryFields, SceneFields, SceneAttachmentFields, eSubtitleOption } from './metadata.types';
import { eSystemObjectType } from '@dpo-packrat/common';

const MAX_INTEGER = 2147483647;

const identifierWhenSelectedValidation = {
    is: true,
    then: yup.string().trim().required('Enter a valid identifier'),
    otherwise: yup.string().trim()
};

const identifierSchema = yup.object().shape({
    id: yup.number().required(),
    identifier: yup.string().trim().when('selected', identifierWhenSelectedValidation),
    identifierType: yup.number().nullable(true)
});

const folderSchema = yup.object().shape({
    id: yup.number().required(),
    name: yup.string().required(),
    variantType: yup.number().nullable(true)
});

const subtitleSchema = yup.object().shape({
    value: yup.string(),
    selected: yup.boolean().required(),
    subtitleOption: yup.number().required(),
    id: yup.number()
});

const selectedSubtitleValidation = {
    test: array => {
        const selectedSubtitle = array.find(subtitle => subtitle.selected);
        if (!selectedSubtitle) return false;
        if (selectedSubtitle.subtitleOption === eSubtitleOption.eInput)
            return !!selectedSubtitle.value;
        return true;
    },
    message: 'Should provide a valid subtitle/name for ingestion'
};

const identifierValidation = {
    test: array => array.length && array.every(identifier => identifier.identifier.length),
    message: 'Should provide at least 1 identifier with valid identifier ID'
};

const identifiersWhenValidation = {
    is: false,
    then: yup.array().of(identifierSchema).test(identifierValidation)
};

const hasModelSourcesValidation = {
    test: array => array.length && array.some(source => source.objectType === eSystemObjectType.eModel),
    message: 'Should provide at least 1 model parent for scene ingestion'
};
const notesWhenUpdate = {
    is: value => value > 0,
    then: yup.string().required()
};

export const subtitleFieldsSchema = yup.array().of(subtitleSchema).test(selectedSubtitleValidation);

export const defaultPhotogrammetryFields: PhotogrammetryFields = {
    systemCreated: true,
    identifiers: [],
    sourceObjects: [],
    derivedObjects: [],
    folders: [],
    name: '',
    description: '',
    dateCaptured: new Date(),
    datasetType: null,
    datasetUse: '[207,208,209]', // indices into Vocabulary: alignment, reconstruction, texture generation
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
    directory: '',
    updateNotes: '',
    idAsset: 0
};

export const photogrammetryFieldsSchemaUpdate = yup.object().shape({
    systemCreated: yup.boolean().required(),
    folders: yup.array().of(folderSchema),
    name: yup.string().required('Name cannot be empty'),
    // description: yup.string().required('Description cannot be empty'),
    dateCaptured: yup.date().required(),
    datasetType: yup.number().typeError('Please select a valid dataset type'),
    datasetFieldId: yup
        .number()
        .nullable(true)
        .typeError('Dataset Field ID must be a positive integer')
        .positive('Dataset Field ID must be a positive integer')
        .max(MAX_INTEGER, 'Dataset Field ID is too large'),
    itemPositionType: yup.number().nullable(true),
    itemPositionFieldId: yup
        .number()
        .nullable(true)
        .typeError('Position Field ID must be a positive integer')
        .positive('Position Field ID must be a positive integer')
        .max(MAX_INTEGER, 'Position Field ID is too large'),
    itemArrangementFieldId: yup
        .number()
        .nullable(true)
        .typeError('Arrangement Field ID must be a positive integer')
        .positive('Arrangement Field ID must be a positive integer')
        .max(MAX_INTEGER, 'Arrangement Field ID is too large'),
    focusType: yup.number().nullable(true),
    lightsourceType: yup.number().nullable(true),
    backgroundRemovalMethod: yup.number().nullable(true),
    clusterType: yup.number().nullable(true),
    clusterGeometryFieldId: yup
        .number()
        .nullable(true)
        .typeError('Cluster Geometry Field ID must be a positive integer')
        .positive('Cluster Geometry Field ID must be a positive integer')
        .max(MAX_INTEGER, 'Cluster Geometry Field ID is too large'),
    cameraSettingUniform: yup.boolean().required(),
    directory: yup.string(),
    updateNotes: yup.string().when('idAsset', notesWhenUpdate),
    datasetUse: yup
        .string()
        .typeError('Must select at least one Dataset Use')
        .test('not-empty-or-brackets', 'Must select at least one Dataset Use', value => {
            return (value !== '') && (value !== '[]'); // indices into Vocabulary: alignment, reconstruction, texture generation
        }),
});

export const photogrammetryFieldsSchema = photogrammetryFieldsSchemaUpdate.shape({
    identifiers: yup.array().of(identifierSchema).when('systemCreated', identifiersWhenValidation),
});

const uvMapSchema = yup.object().shape({
    id: yup.number().required(),
    name: yup.string().required(),
    mapType: yup.number().nullable(true)
});

const sourceObjectSchema = yup.object().shape({
    idSystemObject: yup.number().required(),
    name: yup.string().nullable(),
    identifier: yup.string().nullable(),
    objectType: yup.number().required()
});

export const defaultModelFields: ModelFields = {
    name: '',
    systemCreated: true,
    identifiers: [],
    sourceObjects: [],
    derivedObjects: [],
    dateCreated: null,
    creationMethod: null,
    modality: null,
    units: null,
    purpose: null,
    modelFileType: null,
    directory: '',
    updateNotes: '',
    idAsset: 0,
    subtitles: [{
        value: '',
        selected: false,
        subtitleOption: eSubtitleOption.eInput,
        id: 1
    }, {
        value: '',
        selected: true,
        subtitleOption: eSubtitleOption.eNone,
        id: 0
    }],
    skipSceneGenerate: false,
    ModelUse: '[]',     // used for master models and includes raw_clean/presentation
};

export const modelFieldsSchemaUpdate = yup.object().shape({
    systemCreated: yup.boolean().required(),
    uvMaps: yup.array().of(uvMapSchema),
    sourceObjects: yup.array().of(sourceObjectSchema),
    dateCreated: yup.date().typeError('Date Created is required').max(new Date(new Date().setSeconds(0,0)), 'Date Created cannot be set in the future'),
    creationMethod: yup.number().typeError('Creation method is required'),
    modality: yup.number().typeError('Modality is required'),
    units: yup.number().typeError('Units is required'),
    purpose: yup.number().typeError('Purpose is required'),
    modelFileType: yup.number().typeError('Model File Type is required'),
    roughness: yup.number().nullable(true),
    metalness: yup.number().nullable(true),
    pointCount: yup.number().nullable(true),
    faceCount: yup.number().nullable(true),
    isTwoManifoldUnbounded: yup.boolean().nullable(true),
    isTwoManifoldBounded: yup.boolean().nullable(true),
    selfIntersecting: yup.boolean().nullable(true),
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
    directory: yup.string(),
    updateNotes: yup.string().when('idAsset', notesWhenUpdate),
    ModelUse: yup
        .string()
        .typeError('Must select at least one Use for Master models')
        .test('not-empty-or-brackets', 'Must select at least one Use for Master models', value => {
            return (value !== '') && (value !== '[]'); // indices into Vocabulary: raw_clean, presentation
        }),
});

export const modelFieldsSchema = modelFieldsSchemaUpdate.shape({
    identifiers: yup.array().of(identifierSchema).when('systemCreated', identifiersWhenValidation),
    subtitles: yup.array().of(subtitleSchema).test(selectedSubtitleValidation)
});

export const defaultSceneFields: SceneFields = {
    systemCreated: true,
    identifiers: [],
    sourceObjects: [],
    derivedObjects: [],
    referenceModels: [],
    name: '',
    directory: '',
    EdanUUID: '',
    approvedForPublication: false,
    posedAndQCd: false,
    canBeQCd: false,
    updateNotes: '',
    idAsset: 0,
    subtitles: [{
        value: '',
        selected: true,
        subtitleOption: eSubtitleOption.eInput,
        id: 0
    }]
};

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

export const sceneFieldsSchemaUpdate = yup.object().shape({
    systemCreated: yup.boolean().required(),
    referenceModels: yup.array().of(referenceModelSchema),
    directory: yup.string(),
    updateNotes: yup.string().when('idAsset', notesWhenUpdate)
});

export const sceneFieldsSchema = sceneFieldsSchemaUpdate.shape({
    identifiers: yup.array().of(identifierSchema).when('systemCreated', identifiersWhenValidation),
    sourceObjects: yup.array().of(sourceObjectSchema).test(hasModelSourcesValidation),
    subtitles: yup.array().of(subtitleSchema).test(selectedSubtitleValidation)
});

export const defaultOtherFields: OtherFields = {
    systemCreated: true,
    identifiers: [],
    updateNotes: '',
    idAsset: 0
};

export const otherFieldsSchemaUpdate = yup.object().shape({
    systemCreated: yup.boolean().required(),
});

export const otherFieldsSchema = otherFieldsSchemaUpdate.shape({
    identifiers: yup.array().of(identifierSchema).when('systemCreated', identifiersWhenValidation)
});

export const defaultSceneAttachmentFields: SceneAttachmentFields = {
    type: null,
    category: null,
    units: null,
    modelType: null,
    fileType: null,
    gltfStandardized: false,
    dracoCompressed: false,
    title: '',
    systemCreated: false,
    identifiers: [],
    idAssetVersion: 0
};

export const sceneAttachmentFieldsSchema = yup.object().shape({
    type: yup.number().nullable(true),
    category: yup.number().nullable(true),
    units: yup.number().nullable(true),
    modelType: yup.number().nullable(true),
    fileType: yup.number().nullable(true),
    gltfStandardized: yup.boolean().required(),
    dracoCompressed: yup.boolean().required(),
    title: yup.string().nullable(true),
    idAssetVersion: yup.number().required(),
    systemCreated: yup.boolean().required(),
    identifiers: yup.array().of(identifierSchema).when('systemCreated', identifiersWhenValidation)
});

export type PhotogrammetrySchemaType = typeof photogrammetryFieldsSchema;
export type PhotogrammetrySchemaUpdateType = typeof photogrammetryFieldsSchemaUpdate;
export type ModelSchemaType = typeof modelFieldsSchema;
export type ModelSchemaUpdateType = typeof modelFieldsSchemaUpdate;
export type SceneSchemaType = typeof sceneFieldsSchema;
export type SceneSchemaUpdateType = typeof sceneFieldsSchemaUpdate;
export type OtherSchemaType = typeof otherFieldsSchema;
export type OtherSchemaUpdateType = typeof otherFieldsSchemaUpdate;

export type ValidateFieldsSchema = PhotogrammetrySchemaType | PhotogrammetrySchemaUpdateType | ModelSchemaType | ModelSchemaUpdateType | SceneSchemaType | SceneSchemaUpdateType | OtherSchemaType | OtherSchemaUpdateType;
