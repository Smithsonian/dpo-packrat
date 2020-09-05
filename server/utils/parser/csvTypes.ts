/* eslint-disable camelcase */
export enum CSVTypes {
    subjects = 'subjects',
    items = 'items',
    models = 'models',
    captureData = 'capture_datasets'
}

type CSVHeadersType = {
    [key: string]: string[];
};

export const CSVHeaders: CSVHeadersType = {
    subjects: ['import_row_id', 'local_subject_id', 'subject_guid', 'subject_name', 'holding_entity_name', 'holding_entity_guid'],
    items: ['import_row_id', 'import_parent_id', 'local_item_id', 'item_guid', 'item_display_name', 'item_description', 'item_type'],
    models: ['import_row_id', 'import_parent_id', 'date_of_creation', 'derived_from', 'creation_method', 'units', 'model_purpose', 'file_path'],
    capture_datasets: ['import_row_id', 'import_parent_id', 'model_import_row_id', 'capture_dataset_guid', 'capture_dataset_field_id', 'capture_method', 'capture_dataset_type', 'capture_dataset_name', 'collected_by', 'date_of_capture', 'item_position_type', 'item_position_field_id', 'item_arrangement_field_id', 'positionally_matched_capture_datasets', 'focus_type', 'light_source_type', 'background_removal_method', 'cluster_type', 'directory_path']
};

export type SubjectsCSVFields = {
    import_row_id: number;
    local_subject_id: number;
    subject_guid: string;
    subject_name: string;
    holding_entity_name: string;
    holding_entity_guid: string;
};

export type ItemsCSVFields = {
    import_row_id: number;
    import_parent_id: number;
    local_item_id: number;
    item_guid: string;
    item_display_name: string;
    item_description: string;
    item_type: string;
};

export type ModelsCSVFields = {
    import_row_id: number;
    import_parent_id: number;
    date_of_creation: string;
    derived_from: number;
    creation_method: string;
    units: string;
    model_purpose: string;
    file_path: string;
};

export type CaptureDataCSVFields = {
    import_row_id: number;
    import_parent_id: number;
    model_import_row_id: number;
    capture_dataset_guid: string;
    capture_dataset_field_id: number;
    capture_method: string;
    capture_dataset_type: string;
    capture_dataset_name: string;
    collected_by: string;
    date_of_capture: string;
    item_position_type: string;
    item_position_field_id: number;
    item_arrangement_field_id: number;
    positionally_matched_capture_datasets: string;
    focus_type: string;
    light_source_type: string;
    background_removal_method: string;
    cluster_type: string;
    directory_path: string;
};

export type CSVFields = SubjectsCSVFields | ItemsCSVFields | ModelsCSVFields | CaptureDataCSVFields;
