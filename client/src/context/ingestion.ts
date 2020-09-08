import { useReducer, Dispatch } from 'react';
import lodash from 'lodash';
import { defaultItem } from './ingestion.defaults';
import { eVocabularySetID } from '../types/server';
import { Vocabulary } from '../types/graphql';

export type FileId = string;

export enum FileUploadStatus {
    READY = 'READY',
    UPLOADING = 'UPLOADING',
    COMPLETE = 'COMPLETE',
    CANCELLED = 'CANCELLED',
    FAILED = 'FAILED'
}

export type IngestionFile = {
    id: FileId;
    size: number;
    name: string;
    file: File;
    type: number;
    status: FileUploadStatus;
    progress: number;
    selected: boolean;
    cancel: (() => void) | null;
};

type IngestionUploads = {
    files: IngestionFile[];
    loading: boolean;
};

export type StateSubject = {
    id: number;
    arkId: string;
    unit: string;
    name: string;
};

export type SubjectStep = StateSubject[];

export type StateProject = {
    id: number;
    name: string;
    selected: boolean;
};

export type ProjectStep = StateProject[];

export type StateItem = {
    id: string;
    name: string;
    entireSubject: boolean;
    selected: boolean;
};

export type ItemStep = StateItem[];

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
};

export type StateMetadata = {
    photogrammetry: PhotogrammetryFields;
    file: IngestionFile;
};

export type MetadataStep = StateMetadata[];
export type VocabularyOption = Pick<Vocabulary, 'idVocabulary' | 'Term'>;
export type StateVocabulary = Map<eVocabularySetID, VocabularyOption[]>;

export type Ingestion = {
    uploads: IngestionUploads;
    subjects: SubjectStep;
    projects: ProjectStep;
    items: ItemStep;
    metadatas: MetadataStep;
    vocabularies: StateVocabulary;
};

export enum UPLOAD_ACTIONS {
    LOAD = 'LOAD',
    FETCH_COMPLETE = 'FETCH_COMPLETE',
    FETCH_FAILED = 'FETCH_FAILED',
    START = 'START',
    FAILED = 'FAILED',
    PROGRESS = 'PROGRESS',
    CANCELLED = 'CANCELLED',
    RETRY = 'RETRY',
    COMPLETE = 'COMPLETE',
    REMOVE = 'REMOVE',
    SELECT = 'SELECT',
    SET_CANCEL_HANDLER = 'SET_CANCEL_HANDLER',
    SET_ASSET_TYPE = 'SET_ASSET_TYPE',
    DISCARD_FILES = 'DISCARD_FILES'
}

export enum SUBJECT_ACTIONS {
    ADD_SUBJECT = 'ADD_SUBJECT',
    REMOVE_SUBJECT = 'REMOVE_SUBJECT'
}

export enum PROJECT_ACTIONS {
    ADD_PROJECTS = 'ADD_PROJECTS',
    UPDATE_PROJECT = 'UPDATE_PROJECT'
}

export enum ITEM_ACTIONS {
    ADD_ITEMS = 'ADD_ITEMS',
    UPDATE_ITEM = 'UPDATE_ITEM'
}

export enum METADATA_ACTIONS {
    ADD_METADATA = 'ADD_METADATA',
    UPDATE_METADATA_FIELDS = 'UPDATE_METADATA_FIELDS',
    INGESTION_COMPLETE = 'INGESTION_COMPLETE'
}

export enum VOCABULARY_ACTIONS {
    ADD_VOCABULARIES = 'ADD_VOCABULARIES'
}

const INGESTION_ACTION = {
    UPLOAD: UPLOAD_ACTIONS,
    SUBJECT: SUBJECT_ACTIONS,
    PROJECT: PROJECT_ACTIONS,
    ITEM: ITEM_ACTIONS,
    METADATA: METADATA_ACTIONS,
    VOCABULARY: VOCABULARY_ACTIONS
};

const ingestionState: Ingestion = {
    uploads: {
        files: [],
        loading: true
    },
    subjects: [],
    projects: [],
    items: [defaultItem],
    metadatas: [],
    vocabularies: new Map<eVocabularySetID, VocabularyOption[]>()
};

type UploadDispatchAction =
    | FETCH_COMPLETE
    | FETCH_FAILED
    | LOAD
    | START
    | FAILED
    | PROGRESS
    | CANCELLED
    | COMPLETE
    | REMOVE
    | SELECT
    | SET_CANCEL_HANDLER
    | SET_ASSET_TYPE
    | RETRY
    | DISCARD_FILES;

type FETCH_COMPLETE = {
    type: UPLOAD_ACTIONS.FETCH_COMPLETE;
    files: IngestionFile[];
};

type FETCH_FAILED = {
    type: UPLOAD_ACTIONS.FETCH_FAILED;
};

type LOAD = {
    type: UPLOAD_ACTIONS.LOAD;
    files: IngestionFile[];
};

type START = {
    type: UPLOAD_ACTIONS.START;
    id: FileId;
};

type FAILED = {
    type: UPLOAD_ACTIONS.FAILED;
    id: FileId;
};

type PROGRESS = {
    type: UPLOAD_ACTIONS.PROGRESS;
    id: FileId;
    progress: number;
};

type CANCELLED = {
    type: UPLOAD_ACTIONS.CANCELLED;
    id: FileId;
};

type COMPLETE = {
    type: UPLOAD_ACTIONS.COMPLETE;
    id: FileId;
};

type RETRY = {
    type: UPLOAD_ACTIONS.RETRY;
    id: FileId;
};

type REMOVE = {
    type: UPLOAD_ACTIONS.REMOVE;
    id: FileId;
};

type SELECT = {
    type: UPLOAD_ACTIONS.SELECT;
    id: FileId;
    selected: boolean;
};

type SET_CANCEL_HANDLER = {
    type: UPLOAD_ACTIONS.SET_CANCEL_HANDLER;
    id: FileId;
    cancel: (() => void) | null;
};

type SET_ASSET_TYPE = {
    type: UPLOAD_ACTIONS.SET_ASSET_TYPE;
    id: FileId;
    assetType: number;
};

type DISCARD_FILES = {
    type: UPLOAD_ACTIONS.DISCARD_FILES;
};

type SubjectDispatchAction = ADD_SUBJECT | REMOVE_SUBJECT;

type ADD_SUBJECT = {
    type: SUBJECT_ACTIONS.ADD_SUBJECT;
    subject: StateSubject;
};

type REMOVE_SUBJECT = {
    type: SUBJECT_ACTIONS.REMOVE_SUBJECT;
    arkId: string;
};

type ProjectDispatchAction = ADD_PROJECTS | UPDATE_PROJECT;

type ADD_PROJECTS = {
    type: PROJECT_ACTIONS.ADD_PROJECTS;
    projects: StateProject[];
};

type UPDATE_PROJECT = {
    type: PROJECT_ACTIONS.UPDATE_PROJECT;
    project: StateProject;
};

type ItemDispatchAction = ADD_ITEMS | UPDATE_ITEM;

type ADD_ITEMS = {
    type: ITEM_ACTIONS.ADD_ITEMS;
    items: StateItem[];
};

type UPDATE_ITEM = {
    type: ITEM_ACTIONS.UPDATE_ITEM;
    item: StateItem;
};

type MetadataDispatchAction = ADD_METADATA | UPDATE_METADATA_FIELDS | INGESTION_COMPLETE;

export type MetadataFieldValue = string | number | boolean | Date;

type ADD_METADATA = {
    type: METADATA_ACTIONS.ADD_METADATA;
    metadatas: StateMetadata[];
};

type UPDATE_METADATA_FIELDS = {
    type: METADATA_ACTIONS.UPDATE_METADATA_FIELDS;
    metadatas: StateMetadata[];
};

type INGESTION_COMPLETE = {
    type: METADATA_ACTIONS.INGESTION_COMPLETE;
};

type VocabularyDispatchAction = ADD_VOCABULARIES;

type ADD_VOCABULARIES = {
    type: VOCABULARY_ACTIONS.ADD_VOCABULARIES;
    vocabularies: StateVocabulary;
};

export type IngestionDispatchAction = UploadDispatchAction | SubjectDispatchAction | ProjectDispatchAction | ItemDispatchAction | MetadataDispatchAction | VocabularyDispatchAction;

const ingestionReducer = (state: Ingestion, action: IngestionDispatchAction): Ingestion => {
    const { uploads, subjects, projects, items } = state;
    const { files } = uploads;

    switch (action.type) {
        case INGESTION_ACTION.UPLOAD.FETCH_COMPLETE:
            return {
                ...state,
                uploads: {
                    ...uploads,
                    loading: false
                }
            };

        case INGESTION_ACTION.UPLOAD.FETCH_FAILED:
            return {
                ...state,
                uploads: {
                    ...uploads,
                    loading: false
                }
            };

        case INGESTION_ACTION.UPLOAD.LOAD:
            return {
                ...state,
                uploads: {
                    ...uploads,
                    files: lodash.concat(files, action.files)
                }
            };

        case INGESTION_ACTION.UPLOAD.START:
            return {
                ...state,
                uploads: {
                    ...uploads,
                    files: lodash.forEach(files, file => {
                        if (file.id === action.id) {
                            lodash.set(file, 'progress', 0);
                            lodash.set(file, 'status', FileUploadStatus.UPLOADING);
                        }
                    })
                }
            };

        case INGESTION_ACTION.UPLOAD.FAILED:
            return {
                ...state,
                uploads: {
                    ...uploads,
                    files: lodash.forEach(files, file => {
                        if (file.id === action.id) {
                            lodash.set(file, 'status', FileUploadStatus.FAILED);
                        }
                    })
                }
            };

        case INGESTION_ACTION.UPLOAD.PROGRESS:
            return {
                ...state,
                uploads: {
                    ...uploads,
                    files: lodash.forEach(files, file => {
                        if (file.id === action.id) {
                            lodash.set(file, 'progress', action.progress);
                        }
                    })
                }
            };

        case INGESTION_ACTION.UPLOAD.CANCELLED:
            return {
                ...state,
                uploads: {
                    ...uploads,
                    files: lodash.forEach(files, file => {
                        if (file.id === action.id) {
                            lodash.set(file, 'status', FileUploadStatus.CANCELLED);
                        }
                    })
                }
            };

        case INGESTION_ACTION.UPLOAD.COMPLETE:
            return {
                ...state,
                uploads: {
                    ...uploads,
                    files: lodash.forEach(files, file => {
                        if (file.id === action.id) {
                            lodash.set(file, 'status', FileUploadStatus.COMPLETE);
                            lodash.set(file, 'cancel', null);
                        }
                    })
                }
            };

        case INGESTION_ACTION.UPLOAD.RETRY:
            return {
                ...state,
                uploads: {
                    ...uploads,
                    files: lodash.forEach(files, file => {
                        if (file.id === action.id) {
                            lodash.set(file, 'status', FileUploadStatus.UPLOADING);
                        }
                    })
                }
            };

        case INGESTION_ACTION.UPLOAD.REMOVE:
            return {
                ...state,
                uploads: {
                    ...uploads,
                    files: files.filter(file => {
                        return file.id !== action.id;
                    })
                }
            };

        case INGESTION_ACTION.UPLOAD.SET_CANCEL_HANDLER:
            return {
                ...state,
                uploads: {
                    ...uploads,
                    files: lodash.forEach(files, file => {
                        if (file.id === action.id) {
                            lodash.set(file, 'cancel', action.cancel);
                        }
                    })
                }
            };

        case INGESTION_ACTION.UPLOAD.SELECT:
            return {
                ...state,
                uploads: {
                    ...uploads,
                    files: lodash.forEach(files, file => {
                        if (file.id === action.id) {
                            lodash.set(file, 'selected', action.selected);
                        }
                    })
                }
            };

        case INGESTION_ACTION.UPLOAD.SET_ASSET_TYPE:
            return {
                ...state,
                uploads: {
                    ...uploads,
                    files: lodash.forEach(files, file => {
                        if (file.id === action.id) {
                            lodash.set(file, 'type', action.assetType);
                        }
                    })
                }
            };

        case INGESTION_ACTION.UPLOAD.DISCARD_FILES:
            return {
                ...ingestionState,
                uploads: {
                    ...ingestionState.uploads,
                    loading: false
                }
            };

        case INGESTION_ACTION.METADATA.ADD_METADATA:
            return {
                ...state,
                metadatas: action.metadatas
            };

        case INGESTION_ACTION.METADATA.UPDATE_METADATA_FIELDS:
            return {
                ...state,
                metadatas: action.metadatas
            };

        case INGESTION_ACTION.SUBJECT.ADD_SUBJECT:
            return {
                ...state,
                subjects: [...subjects, action.subject]
            };

        case INGESTION_ACTION.SUBJECT.REMOVE_SUBJECT:
            return {
                ...state,
                subjects: lodash.filter(subjects, ({ arkId }) => arkId !== action.arkId)
            };

        case INGESTION_ACTION.PROJECT.ADD_PROJECTS:
            return {
                ...state,
                projects: action.projects
            };

        case INGESTION_ACTION.PROJECT.UPDATE_PROJECT:
            return {
                ...state,
                projects: lodash.map(projects, project => {
                    if (project.id === action.project.id) {
                        return action.project;
                    }
                    return project;
                })
            };

        case INGESTION_ACTION.ITEM.ADD_ITEMS:
            return {
                ...state,
                items: action.items
            };

        case INGESTION_ACTION.ITEM.UPDATE_ITEM:
            return {
                ...state,
                items: lodash.map(items, item => {
                    if (item.id === action.item.id) {
                        return action.item;
                    }
                    return item;
                })
            };

        case INGESTION_ACTION.VOCABULARY.ADD_VOCABULARIES:
            return {
                ...state,
                vocabularies: action.vocabularies
            };

        case INGESTION_ACTION.METADATA.INGESTION_COMPLETE: {
            const updatedUploadFiles = [...state.uploads.files].filter(({ selected }) => !selected);
            const updatedUploads = {
                ...state.uploads,
                files: updatedUploadFiles
            };

            return {
                ...ingestionState,
                uploads: updatedUploads,
                vocabularies: state.vocabularies
            };
        }

        default:
            return state;
    }
};

export type IngestionDispatch = Dispatch<IngestionDispatchAction>;

export interface IngestionReducer {
    ingestion: Ingestion;
    ingestionDispatch: IngestionDispatch;
}

export default function useIngestionContext(): IngestionReducer {
    const [ingestion, ingestionDispatch] = useReducer(ingestionReducer, ingestionState);

    return {
        ingestion,
        ingestionDispatch
    };
}
