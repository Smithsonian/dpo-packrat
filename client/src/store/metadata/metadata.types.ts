/**
 * Metadata Store Types
 *
 * Type definitions for the metadata store.
 */
import { DetailVersion, ReferenceModel, ReferenceModelAction, RelatedObject } from '../../types/graphql';
import { IngestionFile } from '../upload';

export type StateMetadata = {
    photogrammetry: PhotogrammetryFields;
    model: ModelFields;
    scene: SceneFields;
    other: OtherFields;
    file: IngestionFile;
    sceneAttachment: SceneAttachmentFields;
};

export enum MetadataType {
    photogrammetry = 'photogrammetry',
    model = 'model',
    scene = 'scene',
    other = 'other',
    sceneAttachment = 'sceneAttachment'
}

export enum eSubtitleOption {
    eInherit,
    eNone,
    eInput,
    eForced,
}

export type SubtitleFields = {
    value: string,
    selected: boolean,
    subtitleOption: eSubtitleOption,
    id: number
}[];

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
        name: boolean;
        dateCreated: boolean;
        creationMethod: boolean;
        modality: boolean;
        units: boolean;
        purpose: boolean;
        modelFileType: boolean;
        subtitles: boolean;
    };
    scene: {
        subtitles: boolean;
    }
};

export type MetadataFieldValue = string | number | boolean | null | Date | StateIdentifier[] | StateFolder[] | StateRelatedObject[] | SubtitleFields;

export type MetadataUpdate = {
    valid: boolean;
    selectedFiles: boolean;
    error: boolean;
};

export type StateIdentifier = {
    id: number;
    identifier: string;
    identifierType: number | null;
    idIdentifier: number;
    preferred?: boolean;
};

export type StateFolder = {
    id: number;
    name: string;
    variantType: number | null;
};

export type PhotogrammetryFields = {
    systemCreated: boolean;
    identifiers: StateIdentifier[];
    sourceObjects: StateRelatedObject[];
    derivedObjects: StateRelatedObject[];
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
    idAsset?: number;
    updateNotes?: string;
};

export type ModelFields = {
    name: string;
    systemCreated: boolean;
    identifiers: StateIdentifier[];
    sourceObjects: StateRelatedObject[];
    derivedObjects: StateRelatedObject[];
    dateCreated: Date | string | null;
    creationMethod: number | null;
    modality: number | null;
    units: number | null;
    purpose: number | null;
    modelFileType: number | null;
    directory: string;
    idAsset?: number;
    updateNotes?: string;
    subtitles: SubtitleFields;
};

export type SceneFields = {
    systemCreated: boolean;
    identifiers: StateIdentifier[];
    sourceObjects: StateRelatedObject[];
    derivedObjects: StateRelatedObject[];
    referenceModels: StateReferenceModel[];
    name: string;
    directory: string;
    EdanUUID: string;
    approvedForPublication: boolean;
    posedAndQCd: boolean;
    canBeQCd: boolean;
    idAsset?: number;
    updateNotes?: string;
    subtitles: SubtitleFields;
};

export type OtherFields = {
    systemCreated: boolean;
    identifiers: StateIdentifier[];
    idAsset?: number;
    updateNotes?: string;
};

export type SceneAttachmentFields = {
    type: number | null;
    category: number | null;
    units: number | null;
    modelType: number | null;
    fileType: number | null;
    gltfStandardized: boolean;
    dracoCompressed: boolean;
    title: string;
    idAssetVersion: number;
    systemCreated: boolean;
    identifiers: StateIdentifier[];
};

export type StateRelatedObject = RelatedObject;

export type StateReferenceModel = ReferenceModel;

export type StateDetailVersion = DetailVersion;

export type ValidateFields = PhotogrammetryFields | ModelFields | SceneFields | OtherFields | SceneAttachmentFields;

export { ReferenceModelAction };
