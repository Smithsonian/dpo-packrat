/* eslint-disable @typescript-eslint/no-explicit-any, camelcase */
import { IDocument } from '../../types/voyager';

// c.f. https://github.com/Smithsonian/edan-schemas
export type EdanLabelContent = {
    label: string;
    content: string;
};

export type EdanMedia = {
    content: string;
    type: string;
    thumbnail: string;
    summary?: string;
    guid?: string;
    voyagerId?: string;
    idsId?: string;
    caption?: string;
    alt?: string;
    credit?: string;
    rights?: string;
    mime_type?: string;
    usage?: {
        access?: string;
        text?: string;
        codes?: string;
    }
};

export type EdanMDMContent = {
    descriptiveNonRepeating: {
        title: EdanLabelContent;
        data_source: string;
        record_ID: string;
        unit_code: string;
        title_sort?: string;
        online_media?: {
            media: EdanMedia[];
            mediaCount: string;
        }
        guid?: string;
        metadata_usage?: {
            access?: string;
            text?: string;
            content?: string;
        }
        record_link?: string;
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

export type Edan3DPackageContent = {
    document: IDocument;
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