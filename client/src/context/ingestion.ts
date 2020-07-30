import { useReducer, Dispatch } from 'react';

export enum INGESTION_TRANSFER_STATUS {
    IDLE = 'IDLE',
    PROCESSING = 'PROCESSING'
}

export type FileId = number;

export type IngestionFile = {
    id: FileId;
    data: File;
    blob: string;
};

type IngestionTransfer = {
    files: IngestionFile[];
    pending: IngestionFile[];
    current: IngestionFile | null;
    uploaded: Map<FileId, IngestionFile>;
    failed: Map<FileId, IngestionFile>;
    uploading: boolean;
    progress: Map<FileId, number>;
    status: INGESTION_TRANSFER_STATUS;
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
    REMOVE_FILE = 'REMOVE_FILE'
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
        failed: new Map<FileId, IngestionFile>(),
        status: INGESTION_TRANSFER_STATUS.IDLE
    }
};

const ingestionReducer = (state: Ingestion, action): Ingestion => {
    const { transfer } = state;
    const { files, pending, uploaded, failed, progress } = transfer;

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
                    status: INGESTION_TRANSFER_STATUS.IDLE
                }
            };

        case INGESTION_ACTION.TRANSFER.UPLOAD_ERROR:
            return {
                ...state,
                transfer: {
                    ...transfer,
                    current: null,
                    pending: pending.slice(1),
                    failed: failed.set(action.previous.id, action.previous)
                }
            };

        case INGESTION_ACTION.TRANSFER.REMOVE_FILE:
            return {
                ...state,
                transfer: {
                    ...transfer,
                    files: files.filter(({ id }) => id !== action.id),
                    failed: action.failed
                }
            };

        default:
            return state;
    }
};

type IngestionDispatchAction = {
    type: TRANSFER_ACTIONS;
    id?: FileId;
    files?: IngestionFile[];
    pending?: IngestionFile[];
    failed?: Map<FileId, IngestionFile>;
    current?: IngestionFile | null;
    previous?: IngestionFile | null;
    progress?: number;
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
