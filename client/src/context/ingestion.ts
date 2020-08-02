import { useReducer, Dispatch } from 'react';
import lodash from 'lodash';

export enum IngestionUploadStatus {
    SUCCESS = 'SUCCESS',
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
    SUCCESS = 'SUCCESS',
    CANCELLED = 'CANCELLED',
    FAILED = 'FAILED'
}

export type IngestionFile = {
    id: FileId;
    file: File;
    type: AssetType;
    status: FileUploadStatus;
    progress: number;
    cancel: (() => void) | null;
};

type IngestionUploads = {
    files: IngestionFile[];
};

export type Ingestion = {
    uploads: IngestionUploads;
};

export enum UPLOAD_ACTIONS {
    LOAD = 'LOAD',
    START = 'START',
    FAILED = 'FAILED',
    PROGRESS = 'PROGRESS',
    CANCELLED = 'CANCELLED',
    RETRY = 'RETRY',
    SUCCESS = 'SUCCESS',
    REMOVE = 'REMOVE',
    SET_CANCEL_HANDLER = 'SET_CANCEL_HANDLER',
    SET_ASSET_TYPE = 'SET_ASSET_TYPE'
}

const INGESTION_ACTION = {
    UPLOAD: UPLOAD_ACTIONS
};

const ingestionState: Ingestion = {
    uploads: {
        files: []
    }
};

export type IngestionDispatchAction = LOAD | START | FAILED | PROGRESS | CANCELLED | SUCCESS | REMOVE | SET_CANCEL_HANDLER | SET_ASSET_TYPE | RETRY;

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

type SUCCESS = {
    type: UPLOAD_ACTIONS.SUCCESS;
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

const ingestionReducer = (state: Ingestion, action: IngestionDispatchAction): Ingestion => {
    const { uploads } = state;
    const { files } = uploads;
    console.log(action.type);
    switch (action.type) {
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

        case INGESTION_ACTION.UPLOAD.SUCCESS:
            return {
                ...state,
                uploads: {
                    ...uploads,
                    files: lodash.forEach(files, file => {
                        if (file.id === action.id) {
                            lodash.set(file, 'status', FileUploadStatus.SUCCESS);
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
