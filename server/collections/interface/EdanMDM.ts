/* eslint-disable @typescript-eslint/no-explicit-any, camelcase */
export type EdanLabelContent = {
    label: string;
    content: string;
};

export type EdanMedia = {
    thumbnail: string;
    content: string;
    type: string;
    voyagerId?: string;
    usage: {
        access: string;
        text: string;
        codes: string;
    }
};

export type EdanMDMContent = {
    descriptiveNonRepeating: {
        title: EdanLabelContent;
        record_ID: string;
        unit_code: string;
        metadata_usage: {
            access: string;
            content?: string;
        }
        data_source?: string;
        online_media?: {
            media: EdanMedia[];
            mediaCount: number;
        }
    }

    indexedStructured?: {
        object_type?: string[];
        date?: string[];
        place?: string[];
        topic?: string[];
    }

    freeText?: {
        identifier?: EdanLabelContent[];
        dataSource?: EdanLabelContent[];
        name?: EdanLabelContent[];
        objectRights?: EdanLabelContent[];
        place?: EdanLabelContent[];
        taxonomicName?: EdanLabelContent[];
        notes?: EdanLabelContent[];
        physicalDescription?: EdanLabelContent[];
    }
};

export type EdanRecord = {
    id: string;
    title: string;
    unitCode: string;
    linkedId: string;
    type: string;
    url: string;
    content: any;
    hash: string;
    docSignature: string;
    timestamp: string;
    lastTimeUpdated: string;
    status: number;
    version: string;
    publicSearch: boolean;
    linkedContent: any;
};