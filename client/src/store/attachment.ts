/**
 * Attachment Metadata Store
 *
 * This store manages state for attachment metadata forms used in the ingestion process
 */

import create, { GetState, SetState } from 'zustand';

enum eAttachmentType {
    eScene
}

interface AttachmentMetadata {
    idAssetVersion: number;
}

interface SceneAttachment extends AttachmentMetadata {
    attachmentType: string;
    attachmentCategory: string;
    attachmentUnits: string;
    attachmentModelType: string;
    attachmentFileType: string;
    attachmentgltfStandardized: boolean;
    attachmentDracoCompressed: boolean;
    attachmentTitle: string;
}

type AttachmentStore = {
    sceneAttachments: SceneAttachment[];
    updateAttachmentEntry: () => void;
    getAllAttachmentEntries: () => SceneAttachment[];
    getAttachmentEntry: (idAssetVersion: number, assetType: eAttachmentType) => SceneAttachment | void;
    resetAttachmentEntries: () => void;

};

export const useAttachmentStore = create<AttachmentStore>((set: SetState<AttachmentStore>, get: GetState<AttachmentStore>) => ({
    sceneAttachments: [],
    updateAttachmentEntry: () => {
        set({ sceneAttachments: [] });
    },
    getAllAttachmentEntries: () => {
        const { sceneAttachments } = get();
        return sceneAttachments;
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
