/**
 * Attachment Metadata Store
 *
 * This store manages state for attachment metadata forms used in the ingestion process
 */

import create, { GetState, SetState } from 'zustand';
import { toast } from 'react-toastify';
import { StateIdentifier } from '.';

export enum eAttachmentType {
    eScene = 1
}

interface AttachmentMetadata {
    idAssetVersion: number;
}

export interface SceneAttachment extends AttachmentMetadata {
    type: string | null;
    category: string | null;
    units: string | null;
    modelType: string | null;
    fileType: string | null;
    gltfStandardized: boolean | null;
    dracoCompressed: boolean | null;
    title: string | null;
    systemCreated: boolean;
    identifiers: StateIdentifier[];
}

type AttachmentStore = {
    sceneAttachments: SceneAttachment[];
    createNewAttachmentEntry: (idAssetVersion: number, assetType: eAttachmentType) => void;
    updateAttachmentEntry: (idAssetVersion: number, assetType: eAttachmentType, field: string, value: string | boolean | number | null | StateIdentifier[]) => void;
    getAllAttachmentEntries: (assetType: eAttachmentType) => SceneAttachment[] | [];
    getAttachmentEntry: (idAssetVersion: number, assetType: eAttachmentType) => SceneAttachment | void;
    resetAttachmentEntries: () => void;
};

export const useAttachmentStore = create<AttachmentStore>((set: SetState<AttachmentStore>, get: GetState<AttachmentStore>) => ({
    sceneAttachments: [],
    createNewAttachmentEntry: (idAssetVersion, assetType) => {
        const { sceneAttachments } = get();
        if (assetType === eAttachmentType.eScene) {
            if (!sceneAttachments.find(attachment => attachment.idAssetVersion === idAssetVersion)) {
                const attachmentsCopy = [...sceneAttachments];
                attachmentsCopy.push({
                    idAssetVersion,
                    type: '',
                    category: '',
                    units: '',
                    modelType: '',
                    fileType: '',
                    gltfStandardized: false,
                    dracoCompressed: false,
                    title: '',
                    systemCreated: false,
                    identifiers: []
                });
                set({ sceneAttachments: attachmentsCopy });
            }
        }
    },
    updateAttachmentEntry: (idAssetVersion, assetType, field, value) => {
        const { sceneAttachments } = get();
        let attachmentsCopy;
        if (assetType === eAttachmentType.eScene) {
            attachmentsCopy = [...sceneAttachments];
            const targetAttachment = attachmentsCopy.find((attachment) => attachment.idAssetVersion === idAssetVersion);
            if (!targetAttachment) {
                toast.error(`Error in updating field ${field} with value ${value}`);
                return;
            } else {
                targetAttachment[field] = value;
            }
        }
        set({ sceneAttachments: attachmentsCopy });
    },
    getAllAttachmentEntries: (assetType) => {
        const { sceneAttachments } = get();
        if (assetType === eAttachmentType.eScene)
            return sceneAttachments;
        return [];
    },
    getAttachmentEntry: (idAssetVersion, assetType) => {
        const { sceneAttachments } = get();
        if (assetType === eAttachmentType.eScene) {
            return sceneAttachments.find((attachment) => attachment?.idAssetVersion === idAssetVersion);
        }
        return;
    },
    resetAttachmentEntries: () => {
        set({ sceneAttachments: [] });
    }
}));
