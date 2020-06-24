/**
 * Type resolver for CaptureData
 */
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { CaptureData, Vocabulary, CaptureDataGroup, CaptureDataFile, Asset } from '../../../../../types/graphql';
import {
    fetchVCaptureMethodForCaptureDataID,
    fetchVCaptureDatasetTypeForCaptureDataID,
    fetchVItemPositionTypeForCaptureDataID,
    fetchVFocusTypeForCaptureDataID,
    fetchVLightSourceTypeForCaptureDataID,
    fetchVBackgroundRemovalMethodForCaptureDataID,
    fetchVClusterTypeForCaptureDataID,
    fetchAssetForCaptureDataID,
    fetchCaptureDataGroupForCaptureDataID,
    fetchCaptureDataFileForCaptureDataID,
    fetchCaptureData
} from '../../../../../db';
import { parseVocabulary } from '../../../vocabulary/resolvers/types/Vocabulary';
import { parseAsset } from '../../../asset/resolvers/types/Asset';
import { parseCaptureDataGroups } from './CaptureDataGroup';
import { parseCaptureDataFiles } from './CaptureDataFile';

const CaptureData = {
    VCaptureMethod: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return resolveVCaptureMethodByCaptureDataID(prisma, Number.parseInt(idCaptureData));
    },
    VCaptureDatasetType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return resolveVCaptureDatasetTypeByCaptureDataID(prisma, Number.parseInt(idCaptureData));
    },
    VItemPositionType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return resolveVItemPositionTypeByCaptureDataID(prisma, Number.parseInt(idCaptureData));
    },
    VFocusType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return resolveVFocusTypeByCaptureDataID(prisma, Number.parseInt(idCaptureData));
    },
    VLightSourceType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return resolveVLightSourceTypeByCaptureDataID(prisma, Number.parseInt(idCaptureData));
    },
    VBackgroundRemovalMethod: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return resolveVBackgroundRemovalMethodByCaptureDataID(prisma, Number.parseInt(idCaptureData));
    },
    VClusterType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return resolveVClusterTypeByCaptureDataID(prisma, Number.parseInt(idCaptureData));
    },
    AssetThumbnail: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return resolveAssetByCaptureDataID(prisma, Number.parseInt(idCaptureData));
    },
    CaptureDataGroup: async (parent: Parent, _: Args, context: Context): Promise<CaptureDataGroup[] | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return resolveCaptureDataGroupByCaptureDataID(prisma, Number.parseInt(idCaptureData));
    },
    CaptureDataFile: async (parent: Parent, _: Args, context: Context): Promise<CaptureDataFile[] | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return resolveCaptureDataFileByCaptureDataID(prisma, Number.parseInt(idCaptureData));
    }
};

export async function resolveCaptureDataByID(prisma: PrismaClient, idCaptureData: number): Promise<CaptureData | null> {
    const foundCaptureData = await fetchCaptureData(prisma, idCaptureData);

    return parseCaptureData(foundCaptureData);
}

export async function resolveVCaptureMethodByCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<Vocabulary | null> {
    const foundVCaptureMethod = await fetchVCaptureMethodForCaptureDataID(prisma, idCaptureData);

    return parseVocabulary(foundVCaptureMethod);
}

export async function resolveVCaptureDatasetTypeByCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<Vocabulary | null> {
    const foundVCaptureDatasetType = await fetchVCaptureDatasetTypeForCaptureDataID(prisma, idCaptureData);

    return parseVocabulary(foundVCaptureDatasetType);
}

export async function resolveVItemPositionTypeByCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<Vocabulary | null> {
    const foundVItemPositionType = await fetchVItemPositionTypeForCaptureDataID(prisma, idCaptureData);

    return parseVocabulary(foundVItemPositionType);
}

export async function resolveVFocusTypeByCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<Vocabulary | null> {
    const foundVFocusType = await fetchVFocusTypeForCaptureDataID(prisma, idCaptureData);

    return parseVocabulary(foundVFocusType);
}

export async function resolveVLightSourceTypeByCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<Vocabulary | null> {
    const foundVLightSourceType = await fetchVLightSourceTypeForCaptureDataID(prisma, idCaptureData);

    return parseVocabulary(foundVLightSourceType);
}

export async function resolveVBackgroundRemovalMethodByCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<Vocabulary | null> {
    const foundVBackgroundRemovalMethod = await fetchVBackgroundRemovalMethodForCaptureDataID(prisma, idCaptureData);

    return parseVocabulary(foundVBackgroundRemovalMethod);
}

export async function resolveVClusterTypeByCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<Vocabulary | null> {
    const foundVClusterType = await fetchVClusterTypeForCaptureDataID(prisma, idCaptureData);

    return parseVocabulary(foundVClusterType);
}

export async function resolveAssetByCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<Asset | null> {
    const foundAsset = await fetchAssetForCaptureDataID(prisma, idCaptureData);

    return parseAsset(foundAsset);
}

export async function resolveCaptureDataGroupByCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<CaptureDataGroup[] | null> {
    const foundCaptureDataGroup = await fetchCaptureDataGroupForCaptureDataID(prisma, idCaptureData);

    return parseCaptureDataGroups(foundCaptureDataGroup);
}

export async function resolveCaptureDataFileByCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<CaptureDataFile[] | null> {
    const foundCaptureDataFile = await fetchCaptureDataFileForCaptureDataID(prisma, idCaptureData);

    return parseCaptureDataFiles(foundCaptureDataFile);
}

export function parseCaptureDatas(foundCaptureDatas: DB.CaptureData[] | null): CaptureData[] | null {
    let captureDatas;
    if (foundCaptureDatas) {
        captureDatas = foundCaptureDatas.map(captureData => parseCaptureData(captureData));
    }

    return captureDatas;
}

export function parseCaptureData(foundCaptureData: DB.CaptureData | null): CaptureData | null {
    let captureData;
    if (foundCaptureData) {
        const {
            idCaptureData,
            DateCaptured,
            Description,
            CaptureDatasetFieldID,
            ItemPositionFieldID,
            ItemArrangementFieldID,
            ClusterGeometryFieldID,
            CameraSettingsUniform
        } = foundCaptureData;
        captureData = {
            idCaptureData: String(idCaptureData),
            DateCaptured,
            Description,
            CaptureDatasetFieldID,
            ItemPositionFieldID,
            ItemArrangementFieldID,
            ClusterGeometryFieldID,
            CameraSettingsUniform
        };
    }

    return captureData;
}

export default CaptureData;
