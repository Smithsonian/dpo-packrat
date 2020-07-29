import { useReducer, Dispatch } from 'react';

export enum INGESTION_TRANSFER_STATUS {
    IDLE = 'IDLE',
    LOADED = 'LOADED',
    INIT = 'INIT',
    PENDING = 'PENDING',
    FILES_UPLOADED = 'FILES_UPLOADED',
    UPLOAD_ERROR = 'UPLOAD_ERROR'
}

export type IngestionFile = {
    id: number;
    file: File;
    src: string;
};

type IngestionTransfer = {
    files: IngestionFile[];
    pending: IngestionFile[];
    next: IngestionFile | null;
    uploading: boolean;
    uploaded: { [id: number]: IngestionFile };
    progress: number;
    error: string | null;
    status: INGESTION_TRANSFER_STATUS;
};

export type Ingestion = {
    transfer: IngestionTransfer;
};

const ingestionState: Ingestion = {
    transfer: {
        files: [],
        pending: [],
        next: null,
        uploading: false,
        progress: 0,
        uploaded: {},
        error: null,
        status: INGESTION_TRANSFER_STATUS.IDLE
    }
};

export enum TRANSFER_ACTIONS {
    LOAD = 'LOAD',
    SUBMIT = 'SUBMIT',
    NEXT = 'NEXT',
    FILE_UPLOADED = 'FILE_UPLOADED',
    FILES_UPLOADED = 'FILES_UPLOADED',
    SET_UPLOAD_ERROR = 'SET_UPLOAD_ERROR',
    UPLOAD_PROGRESS = 'UPLOAD_PROGRESS'
}

const INGESTION_ACTION = {
    TRANSFER: TRANSFER_ACTIONS
};

const ingestionReducer = (state: Ingestion, action): Ingestion => {
    switch (action.type) {
        case INGESTION_ACTION.TRANSFER.LOAD:
            return {
                ...state,
                transfer: {
                    ...state.transfer,
                    files: action.files,
                    status: INGESTION_TRANSFER_STATUS.LOADED
                }
            };

        case INGESTION_ACTION.TRANSFER.SUBMIT:
            return {
                ...state,
                transfer: {
                    ...state.transfer,
                    uploading: true,
                    pending: state.transfer.files,
                    status: INGESTION_TRANSFER_STATUS.INIT
                }
            };

        case INGESTION_ACTION.TRANSFER.NEXT:
            return {
                ...state,
                transfer: {
                    ...state.transfer,
                    next: action.next,
                    status: INGESTION_TRANSFER_STATUS.PENDING
                }
            };

        case INGESTION_ACTION.TRANSFER.FILE_UPLOADED:
            return {
                ...state,
                transfer: {
                    ...state.transfer,
                    next: null,
                    pending: action.pending,
                    progress: 0,
                    uploaded: {
                        ...state.transfer.uploaded,
                        [action.prev.id]: action.prev.file
                    }
                }
            };

        case INGESTION_ACTION.TRANSFER.UPLOAD_PROGRESS:
            return {
                ...state,
                transfer: {
                    ...state.transfer,
                    progress: action.progress
                }
            };

        case INGESTION_ACTION.TRANSFER.FILES_UPLOADED:
            return {
                ...state,
                transfer: {
                    ...state.transfer,
                    uploading: false,
                    status: INGESTION_TRANSFER_STATUS.FILES_UPLOADED
                }
            };

        case INGESTION_ACTION.TRANSFER.SET_UPLOAD_ERROR:
            return {
                ...state,
                transfer: {
                    ...state.transfer,
                    error: action.error,
                    status: INGESTION_TRANSFER_STATUS.UPLOAD_ERROR
                }
            };

        default:
            return state;
    }
};

type IngestionDispatchAction = {
    type: TRANSFER_ACTIONS;
    files?: IngestionFile[];
    pending?: IngestionFile[];
    next?: IngestionFile | null;
    prev?: IngestionFile | null;
    progress?: number;
    error?: string | null;
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
