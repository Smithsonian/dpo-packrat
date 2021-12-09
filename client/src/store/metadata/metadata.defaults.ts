/**
 * Metadata Store Defaults
 *
 * Default field definitions for the metadata store.
 */
import * as yup from 'yup';
import { ModelFields, OtherFields, PhotogrammetryFields, SceneFields, SceneAttachmentFields } from './metadata.types';

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

const identifierValidation = {
    test: array => array.length && array.every(identifier => identifier.identifier.length),
    message: 'Should provide at least 1 identifier with valid identifier ID'
};

const identifiersWhenValidation = {
    is: false,
    then: yup.array().of(identifierSchema).test(identifierValidation)
};

const notesWhenUpdate = {
    is: value => value > 0,
    then: yup.string().required()
};

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
        .max(2147483647, 'Dataset Field ID is too large'),
    itemPositionType: yup.number().nullable(true),
    itemPositionFieldId: yup
        .number()
        .nullable(true)
        .typeError('Item Position Field ID must be a positive integer')
        .positive('Item Position Field ID must be a positive integer')
        .max(2147483647, 'Item Position Field ID is too large'),
    itemArrangementFieldId: yup
        .number()
        .nullable(true)
        .typeError('Item Arrangement Field ID must be a positive integer')
        .positive('Item Arrangement Field ID must be a positive integer')
        .max(2147483647, 'Item Arrangement Field ID is too large'),
    focusType: yup.number().nullable(true),
    lightsourceType: yup.number().nullable(true),
    backgroundRemovalMethod: yup.number().nullable(true),
    clusterType: yup.number().nullable(true),
    clusterGeometryFieldId: yup
        .number()
        .nullable(true)
        .typeError('Cluster Geometry Field ID must be a positive integer')
        .positive('Cluster Geometry Field ID must be a positive integer')
        .max(2147483647, 'Cluster Geometry Field ID is too large'),
    cameraSettingUniform: yup.boolean().required(),
    directory: yup.string(),
    updateNotes: yup.string().when('idAsset', notesWhenUpdate)
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
    dateCaptured: null,
    creationMethod: null,
    modality: null,
    units: null,
    purpose: null,
    modelFileType: null,
    directory: '',
    updateNotes: '',
    idAsset: 0
};

export const modelFieldsSchemaUpdate = yup.object().shape({
    name: yup.string().min(1, 'Name must have at least one character').required('Name is required'),
    systemCreated: yup.boolean().required(),
    uvMaps: yup.array().of(uvMapSchema),
    sourceObjects: yup.array().of(sourceObjectSchema),
    dateCaptured: yup.date().typeError('Date Captured is required'),
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
    updateNotes: yup.string().when('idAsset', notesWhenUpdate)
});

export const modelFieldsSchema = modelFieldsSchemaUpdate.shape({
    identifiers: yup.array().of(identifierSchema).when('systemCreated', identifiersWhenValidation),
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
    updateNotes: '',
    idAsset: 0
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
