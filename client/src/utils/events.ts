import { FileId } from '../store';

export enum UploadEventType {
    PROGRESS = 'PROGRESS',
    SET_CANCELLED = 'SET_CANCELLED',
    FAILED = 'FAILED',
    COMPLETE = 'COMPLETE',
}

export type UploadProgressEvent = {
    id: FileId;
    progress: number;
};

export type UploadSetCancelEvent = {
    id: FileId;
    onCancel: () => void;
};

export type UploadFailedEvent = {
    id: FileId;
    message: string;
};

export type UploadCompleteEvent = {
    id: FileId;
};


export type UploadEventData = UploadProgressEvent | UploadFailedEvent | UploadCompleteEvent;

class UploadEvents {
    static subscribe(event: UploadEventType, listener: EventListenerOrEventListenerObject): void {
        window.addEventListener(event, listener);
    }

    static dispatch(event: UploadEventType, data: UploadEventData): void {
        const customEvent = new CustomEvent(event, {
            detail: data
        });

        window.dispatchEvent(customEvent);
    }

    static unsubscribe(event: UploadEventType, listener: EventListenerOrEventListenerObject): void {
        window.removeEventListener(event, listener);
    }
}

export { UploadEvents };
