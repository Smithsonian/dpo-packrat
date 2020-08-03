import { useReducer, Dispatch } from 'react';
import lodash from 'lodash';

export enum IngestionUploadStatus {
    COMPLETE = 'COMPLETE',
    FAILED = 'FAILED'
}

export type IngestionUploadResponse = {
    data: {
        uploadAsset: {
            status: IngestionUploadStatus;
        };
    };
};

export type FileId = string;

export enum AssetType {
    Diconde = 'Diconde',
    Photogrammetry = 'Photogrammetry'
}

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
    type: AssetType;
    status: FileUploadStatus;
    progress: number;
    selected: boolean;
    cancel: (() => void) | null;
};

type IngestionUploads = {
    files: IngestionFile[];
    loading: boolean;
};

export type MetadataStep = {
    file: IngestionFile;
};

export type Ingestion = {
    uploads: IngestionUploads;
    metadata: MetadataStep[];
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
    SET_ASSET_TYPE = 'SET_ASSET_TYPE'
}

export enum METADATA_ACTIONS {
    ADD_STEP = 'ADD_STEP'
}

const INGESTION_ACTION = {
    UPLOAD: UPLOAD_ACTIONS,
    METADATA: METADATA_ACTIONS
};

const ingestionState: Ingestion = {
    uploads: {
        files: [],
        loading: true
    },
    metadata: []
};

type UploadDispatchAction = FETCH_COMPLETE | FETCH_FAILED | LOAD | START | FAILED | PROGRESS | CANCELLED | COMPLETE | REMOVE | SELECT | SET_CANCEL_HANDLER | SET_ASSET_TYPE | RETRY;

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
    assetType: AssetType;
};

type MetadataDispatchAction = ADD_STEP;

type ADD_STEP = {
    type: METADATA_ACTIONS.ADD_STEP;
    metadata: MetadataStep[];
};

export type IngestionDispatchAction = UploadDispatchAction | MetadataDispatchAction;

const ingestionReducer = (state: Ingestion, action: IngestionDispatchAction): Ingestion => {
    const { uploads } = state;
    const { files } = uploads;

    console.log(action.type);

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

        case INGESTION_ACTION.METADATA.ADD_STEP:
            return {
                ...state,
                metadata: action.metadata
            };

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
    console.log(ingestion.metadata);
    return {
        ingestion,
        ingestionDispatch
    };
}
