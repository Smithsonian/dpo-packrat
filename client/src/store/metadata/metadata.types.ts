/**
 * Metadata Store Types
 *
 * Type definitions for the metadata store.
 */
import { IngestionFile } from '../upload';

export type StateMetadata = {
    photogrammetry: PhotogrammetryFields;
    model: ModelFields;
    scene: SceneFields;
    other: OtherFields;
    file: IngestionFile;
};

export enum MetadataType {
    photogrammetry = 'photogrammetry',
    model = 'model',
    scene = 'scene',
    other = 'other'
}

export type MetadataInfo = {
    metadata: StateMetadata;
    readonly metadataIndex: number;
    isLast: boolean;
};

export type FieldErrors = {
    photogrammetry: {
        dateCaptured: boolean;
        datasetType: boolean;
    };
    model: {
        dateCaptured: boolean;
        creationMethod: boolean;
        modality: boolean;
        units: boolean;
        purpose: boolean;
        modelFileType: boolean;
    };
};

export type MetadataFieldValue = string | number | boolean | null | Date | StateIdentifier[] | StateFolder[] | StateUVMap[];

export type MetadataUpdate = {
    valid: boolean;
    selectedFiles: boolean;
    error: boolean;
};

export type StateIdentifier = {
    id: number;
    identifier: string;
    identifierType: number | null;
    selected: boolean;
};

export type StateFolder = {
    id: number;
    name: string;
    variantType: number | null;
};

export type PhotogrammetryFields = {
    systemCreated: boolean;
    identifiers: StateIdentifier[];
    folders: StateFolder[];
    description: string;
    dateCaptured: Date;
    datasetType: number | null;
    datasetFieldId: number | null;
    itemPositionType: number | null;
    itemPositionFieldId: number | null;
    itemArrangementFieldId: number | null;
    focusType: number | null;
    lightsourceType: number | null;
    backgroundRemovalMethod: number | null;
    clusterType: number | null;
    clusterGeometryFieldId: number | null;
    cameraSettingUniform: boolean;
    directory: string;
};

export type StateUVMap = {
    id: number;
    name: string;
    mapType: number | null;
};

export type ModelFields = {
    systemCreated: boolean;
    identifiers: StateIdentifier[];
    uvMaps: StateUVMap[];
    dateCaptured: Date;
    creationMethod: number | null;
    master: boolean;
    authoritative: boolean;
    modality: number | null;
    units: number | null;
    purpose: number | null;
    modelFileType: number | null;
    roughness: number | null;
    metalness: number | null;
    pointCount: number | null;
    faceCount: number | null;
    isWatertight: boolean | null;
    hasNormals: boolean | null;
    hasVertexColor: boolean | null;
    hasUVSpace: boolean | null;
    boundingBoxP1X: number | null;
    boundingBoxP1Y: number | null;
    boundingBoxP1Z: number | null;
    boundingBoxP2X: number | null;
    boundingBoxP2Y: number | null;
    boundingBoxP2Z: number | null;
    directory: string;
};

export type SceneFields = {
    systemCreated: boolean;
    identifiers: StateIdentifier[];
};

export type OtherFields = {
    systemCreated: boolean;
    identifiers: StateIdentifier[];
};

export type ValidateFields = PhotogrammetryFields | ModelFields | SceneFields | OtherFields;