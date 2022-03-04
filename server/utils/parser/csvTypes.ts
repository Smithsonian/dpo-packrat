/* eslint-disable camelcase */
export enum CSVTypes {
    captureDataPhoto = 'capture_data_photo',
    models = 'models',
    scenes = 'scenes',
}

type CSVHeadersType = Record<string, string[]>;

export const CSVHeaders: CSVHeadersType = {
    capture_data_photo: ['subject_guid', 'subject_name', 'unit_guid', 'unit_name', 'item_guid', 'item_name', 'item_subtitle', 'entire_subject', 'name', 'date_captured', 'description', 'capture_dataset_type', 'capture_dataset_field_id', 'item_position_type', 'item_position_field_id', 'item_arrangement_field_id', 'focus_type', 'light_source_type', 'background_removal_method', 'cluster_type', 'cluster_geometry_field_id', 'directory_path'],
    models: ['subject_guid', 'subject_name', 'unit_guid', 'unit_name', 'item_guid', 'item_name', 'item_subtitle', 'entire_subject', 'name', 'model_subtitle', 'date_created', 'creation_method', 'modality', 'units', 'purpose', 'directory_path'],
    scenes: ['subject_guid', 'subject_name', 'unit_guid', 'unit_name', 'item_guid', 'item_name', 'item_subtitle', 'entire_subject', 'name', 'scene_subtitle', 'posed_and_qcd', 'approved_for_publication', 'directory_path'],
};

export type SubjectsCSVFields = {
    subject_guid: string;
    subject_name: string;
    unit_guid: string;
    unit_name: string;
};

export type ItemsCSVFields = {
    item_guid: string;
    item_name: string;
    item_subtitle: string;
    entire_subject: number;
};

export type CaptureDataPhotoCSVFields = {
    name: string;
    date_captured: string;
    description: string;
    capture_dataset_type: string;
    capture_dataset_field_id: number
    item_position_type: string;
    item_position_field_id: number;
    item_arrangement_field_id: number;
    focus_type: string;
    light_source_type: string;
    background_removal_method: string;
    cluster_type: string;
    cluster_geometry_field_id: number;
    directory_path: string;
};

export type ModelsCSVFields = {
    name: string;
    model_subtitle: string;
    date_created: string;
    creation_method: string;
    modality: string;
    units: string;
    purpose: string;
    directory_path: string;
};

export type ScenesCSVFields = {
    name: string;
    scene_subtitle: string;
    posed_and_qcd: string;
    approved_for_publication: string;
    directory_path: string;
};

export type CSVFields = SubjectsCSVFields | ItemsCSVFields | CaptureDataPhotoCSVFields | ModelsCSVFields | ScenesCSVFields;
