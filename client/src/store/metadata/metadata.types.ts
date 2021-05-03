/**
 * Metadata Store Types
 *
 * Type definitions for the metadata store.
 */
import { AssetDetail, DetailVersion, ReferenceModel, ReferenceModelAction, RelatedObject } from '../../types/graphql';
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

export type MetadataFieldValue = string | number | boolean | null | Date | StateIdentifier[] | StateFolder[] | StateRelatedObject[];

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
    idIdentifier: number;
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
    name: string;
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

export type ModelFields = {
    name: string;
    systemCreated: boolean;
    identifiers: StateIdentifier[];
    sourceObjects: StateRelatedObject[];
    dateCaptured: Date | string | null;
    creationMethod: number | null;
    master: boolean;
    authoritative: boolean;
    modality: number | null;
    units: number | null;
    purpose: number | null;
    modelFileType: number | null;
    directory: string;
};

export type SceneFields = {
    systemCreated: boolean;
    identifiers: StateIdentifier[];
    referenceModels: StateReferenceModel[];
    hasBeenQCd: boolean;
    isOriented: boolean;
    name: string;
};

export type OtherFields = {
    systemCreated: boolean;
    identifiers: StateIdentifier[];
};

export type StateRelatedObject = RelatedObject;

export type StateReferenceModel = ReferenceModel;

export type StateAssetDetail = AssetDetail;

export type StateDetailVersion = DetailVersion;

export type ValidateFields = PhotogrammetryFields | ModelFields | SceneFields | OtherFields;

export { ReferenceModelAction };
