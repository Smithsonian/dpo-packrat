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

    freetext?: {
        identifier?: EdanLabelContent[];
        dataSource?: EdanLabelContent[];
        date?: EdanLabelContent[];
        name?: EdanLabelContent[];
        objectRights?: EdanLabelContent[];
        place?: EdanLabelContent[];
        taxonomicName?: EdanLabelContent[];
        notes?: EdanLabelContent[];
        physicalDescription?: EdanLabelContent[];
    }
};

// c.f. https://confluence.si.edu/display/3W2/Voyager+publishing+workflow
export type Edan3DResourceAttributeUnits = 'mm' | 'cm' | 'm' | 'km' | 'in' | 'ft' | 'yd' | 'mi';
export type Edan3DResourceAttributeModelFileType = 'obj' | 'ply' | 'stl' | 'glb' | 'x3d' | 'gltf' | 'usdz';
export type Edan3DResourceAttributeFileType = 'zip' | 'glb' | 'usdz';
export type Edan3DResourceType = '3D mesh' | 'CAD model';
export type Edan3DResourceCategory = 'Full resolution' | 'Medium resolution' | 'Low resolution' | 'Watertight' | 'iOS AR model';

export type Edan3DResourceAttribute = {
    UNITS?: Edan3DResourceAttributeUnits;
    MODEL_FILE_TYPE?: Edan3DResourceAttributeModelFileType;
    FILE_TYPE?: Edan3DResourceAttributeFileType;
    GLTF_STANDARDIZED?: boolean;
    DRACO_COMPRESSED?: boolean;
};

export type Edan3DResource = {          // c.f. https://confluence.si.edu/display/3W2/Voyager+publishing+workflow
    filename?: string;                  // actual resource filename
    url?: string;                       // https://3d-api.si.edu/content/document/3d_package:$$SceneGUID$$/resources/$$filename$$
    type?: Edan3DResourceType;          // Possible values: '3D mesh', 'CAD model'
    category?: Edan3DResourceCategory;  // Possible values: 'Full resolution', 'Medium resolution', 'Low resolution', 'Watertight', 'iOS AR model'
    title?: string;                     // name, below, plus ($$category$$ $$type$$, $$attributes.MODEL_FILE_TYPE$$, scale in $$attributes.UNITS$$)
    name?: string;                      // Full title of edanmdm record, plus a possible scene title
    attributes?: Edan3DResourceAttribute[];
};

export type Edan3DPackageContent = {
    document?: IDocument;
    resources?: Edan3DResource[];
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

export const EdanLabelContentDelimiter: string = '$PR$';

export function parseEdanMetadata(metadata: string): { label: string, content: string } {
    let [label, content] = metadata.split(EdanLabelContentDelimiter, 2);
    if (content === undefined) {
        content = label;
        label = '';
    }
    return { label, content };
}