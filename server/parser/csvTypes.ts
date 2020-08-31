/* eslint-disable camelcase */
export enum CSVTypes {
    subjects = 'subjects',
    items = 'items',
    models = 'models'
}

type CSVHeadersType = {
    [key: string]: string[];
};

export const CSVHeaders: CSVHeadersType = {
    subjects: ['import_row_id', 'local_subject_id', 'subject_guid', 'subject_name', 'holding_entity_name', 'holding_entity_guid'],
    items: ['import_row_id', 'import_parent_id', 'local_item_id', 'item_guid', 'item_display_name', 'item_description', 'item_type'],
    models: ['import_row_id', 'import_parent_id', 'date_of_creation', 'derived_from', 'creation_method', 'units', 'model_purpose', 'file_path']
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

export type CSVFields = SubjectsCSVFields | ItemsCSVFields | ModelsCSVFields;
