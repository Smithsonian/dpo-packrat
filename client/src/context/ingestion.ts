import { useReducer, Dispatch } from 'react';
import lodash from 'lodash';

export enum INGESTION_TRANSFER_STATUS {
    IDLE = 'IDLE',
    PROCESSING = 'PROCESSING',
    FINISHED = 'FINISHED',
    ERROR = 'ERROR'
}

export type FileId = string;

export enum AssetType {
    Diconde = 'Diconde',
    Photogrammetry = 'Photogrammetry'
}

export type IngestionFile = {
    id: FileId;
    file: File;
    type: AssetType;
};

type IngestionTransfer = {
    files: IngestionFile[];
    pending: IngestionFile[];
    current: IngestionFile | null;
    uploaded: Map<FileId, IngestionFile>;
    failed: Map<FileId, IngestionFile>;
    uploading: boolean;
    error: string | null;
    progress: Map<FileId, number>;
    status: INGESTION_TRANSFER_STATUS;
    abort: null | (() => void);
};

export type Ingestion = {
    transfer: IngestionTransfer;
};

export enum TRANSFER_ACTIONS {
    LOAD = 'LOAD',
    SUBMIT = 'SUBMIT',
    START_NEXT = 'START_NEXT',
    FILE_UPLOADED = 'FILE_UPLOADED',
    UPLOAD_PROGRESS = 'UPLOAD_PROGRESS',
    UPLOAD_ERROR = 'UPLOAD_ERROR',
    UPLOAD_COMPLETE = 'UPLOAD_COMPLETE',
    REMOVE_FILE = 'REMOVE_FILE',
    CHANGE_ASSET_TYPE = 'CHANGE_ASSET_TYPE',
    SET_ABORT_HANDLER = 'SET_ABORT_HANDLER'
}

const INGESTION_ACTION = {
    TRANSFER: TRANSFER_ACTIONS
};

const ingestionState: Ingestion = {
    transfer: {
        files: [],
        pending: [],
        current: null,
        uploading: false,
        progress: new Map<FileId, number>(),
        uploaded: new Map<FileId, IngestionFile>(),
        error: null,
        failed: new Map<FileId, IngestionFile>(),
        status: INGESTION_TRANSFER_STATUS.IDLE,
        abort: null
    }
};

export type IngestionDispatchAction =
    | LOAD
    | SUBMIT
    | START_NEXT
    | FILE_UPLOADED
    | UPLOAD_PROGRESS
    | UPLOAD_COMPLETE
    | UPLOAD_ERROR
    | REMOVE_FILE
    | CHANGE_ASSET_TYPE
    | SET_ABORT_HANDLER;

type LOAD = {
    type: TRANSFER_ACTIONS.LOAD;
    files: IngestionFile[];
};

type SUBMIT = {
    type: TRANSFER_ACTIONS.SUBMIT;
    pending: IngestionFile[];
    failed: Map<FileId, IngestionFile>;
};

type START_NEXT = {
    type: TRANSFER_ACTIONS.START_NEXT;
    current: IngestionFile;
};

type SET_ABORT_HANDLER = {
    type: TRANSFER_ACTIONS.SET_ABORT_HANDLER;
    abort: null | (() => void);
};

type FILE_UPLOADED = {
    type: TRANSFER_ACTIONS.FILE_UPLOADED;
    previous: IngestionFile;
};

type UPLOAD_PROGRESS = {
    type: TRANSFER_ACTIONS.UPLOAD_PROGRESS;
    id: FileId;
    progress: number;
};

type UPLOAD_COMPLETE = {
    type: TRANSFER_ACTIONS.UPLOAD_COMPLETE;
};

type UPLOAD_ERROR = {
    type: TRANSFER_ACTIONS.UPLOAD_ERROR;
    error: string;
    previous: IngestionFile;
};

type REMOVE_FILE = {
    type: TRANSFER_ACTIONS.REMOVE_FILE;
    id: FileId;
    progress: Map<FileId, number>;
    failed: Map<FileId, IngestionFile>;
};

type CHANGE_ASSET_TYPE = {
    type: TRANSFER_ACTIONS.CHANGE_ASSET_TYPE;
    id: FileId;
    assetType: AssetType;
};

const ingestionReducer = (state: Ingestion, action: IngestionDispatchAction): Ingestion => {
    const { transfer } = state;
    const { files, pending, uploaded, failed, progress, status } = transfer;

    switch (action.type) {
        case INGESTION_ACTION.TRANSFER.LOAD:
            return {
                ...state,
                transfer: {
                    ...transfer,
                    files: action.files
                }
            };

        case INGESTION_ACTION.TRANSFER.SUBMIT:
            return {
                ...state,
                transfer: {
                    ...transfer,
                    uploading: true,
                    pending: action.pending,
                    failed: action.failed,
                    error: null,
                    status: INGESTION_TRANSFER_STATUS.PROCESSING
                }
            };

        case INGESTION_ACTION.TRANSFER.START_NEXT:
            return {
                ...state,
                transfer: {
                    ...transfer,
                    current: action.current
                }
            };

        case INGESTION_ACTION.TRANSFER.SET_ABORT_HANDLER:
            return {
                ...state,
                transfer: {
                    ...transfer,
                    abort: action.abort
                }
            };

        case INGESTION_ACTION.TRANSFER.FILE_UPLOADED:
            return {
                ...state,
                transfer: {
                    ...transfer,
                    current: null,
                    pending: pending.slice(1),
                    uploaded: uploaded.set(action.previous.id, action.previous)
                }
            };

        case INGESTION_ACTION.TRANSFER.UPLOAD_PROGRESS:
            return {
                ...state,
                transfer: {
                    ...transfer,
                    progress: progress.set(action.id, action.progress)
                }
            };

        case INGESTION_ACTION.TRANSFER.UPLOAD_COMPLETE:
            return {
                ...state,
                transfer: {
                    ...transfer,
                    current: null,
                    uploading: false,
                    status: status === INGESTION_TRANSFER_STATUS.ERROR ? INGESTION_TRANSFER_STATUS.ERROR : INGESTION_TRANSFER_STATUS.FINISHED
                }
            };

        case INGESTION_ACTION.TRANSFER.UPLOAD_ERROR:
            return {
                ...state,
                transfer: {
                    ...transfer,
                    current: null,
                    abort: null,
                    pending: pending.slice(1),
                    failed: failed.set(action.previous.id, action.previous),
                    error: action.error,
                    status: INGESTION_TRANSFER_STATUS.ERROR
                }
            };

        case INGESTION_ACTION.TRANSFER.REMOVE_FILE:
            return {
                ...state,
                transfer: {
                    ...transfer,
                    abort: null,
                    progress: action.progress,
                    files: files.filter(({ id }) => id !== action.id),
                    failed: action.failed
                }
            };

        case INGESTION_ACTION.TRANSFER.CHANGE_ASSET_TYPE:
            return {
                ...state,
                transfer: {
                    ...transfer,
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
