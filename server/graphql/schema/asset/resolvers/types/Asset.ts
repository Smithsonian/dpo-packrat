/**
 * Type resolver for Asset
 */
import { fetchAsset, fetchAssetGroupForAssetID, fetchCaptureDataFilesForAssetID, fetchScenesForAssetID, fetchIntermediaryFilesForAssetID } from '../../../../../db';
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Asset, AssetGroup, CaptureDataFile, Scene, IntermediaryFile } from '../../../../../types/graphql';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { parseAssetGroup } from './AssetGroup';
import { parseCaptureDataFiles } from '../../../capturedata/resolvers/types/CaptureDataFile';
import { parseScenes } from '../../../scene/resolvers/types/Scene';
import { parseIntermediaryFiles } from '../../../scene/resolvers/types/IntermediaryFile';

const Asset = {
    assetGroup: async (parent: Parent, _: Args, context: Context): Promise<AssetGroup | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveAssetGroupByAssetID(prisma, Number.parseInt(id));
    },
    captureDataFiles: async (parent: Parent, _: Args, context: Context): Promise<CaptureDataFile[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveCaptureDataFilesByAssetID(prisma, Number.parseInt(id));
    },
    scenes: async (parent: Parent, _: Args, context: Context): Promise<Scene[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveScenesByAssetID(prisma, Number.parseInt(id));
    },
    intermediaryFiles: async (parent: Parent, _: Args, context: Context): Promise<IntermediaryFile[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveIntermediaryFilesByAssetID(prisma, Number.parseInt(id));
    }
};

export async function resolveAssetByID(prisma: PrismaClient, assetId: number): Promise<Asset | null> {
    const foundAsset = await fetchAsset(prisma, assetId);

    return parseAsset(foundAsset);
}

export async function resolveAssetGroupByAssetID(prisma: PrismaClient, assetId: number): Promise<AssetGroup | null> {
    const foundAssetGroup = await fetchAssetGroupForAssetID(prisma, assetId);

    return parseAssetGroup(foundAssetGroup);
}

export async function resolveCaptureDataFilesByAssetID(prisma: PrismaClient, assetId: number): Promise<CaptureDataFile[] | null> {
    const foundCaptureDataFiles = await fetchCaptureDataFilesForAssetID(prisma, assetId);

    return parseCaptureDataFiles(foundCaptureDataFiles);
}

export async function resolveScenesByAssetID(prisma: PrismaClient, assetId: number): Promise<Scene[] | null> {
    const foundScenes = await fetchScenesForAssetID(prisma, assetId);

    return parseScenes(foundScenes);
}

export async function resolveIntermediaryFilesByAssetID(prisma: PrismaClient, assetId: number): Promise<IntermediaryFile[] | null> {
    const foundIntermediaryFiles = await fetchIntermediaryFilesForAssetID(prisma, assetId);

    return parseIntermediaryFiles(foundIntermediaryFiles);
}

export function parseAssets(foundAssets: DB.Asset[] | null): Asset[] | null {
    let assets;
    if (foundAssets) {
        assets = foundAssets.map(asset => parseAsset(asset));
    }

    return assets;
}

export function parseAsset(foundAsset: DB.Asset | null): Asset | null {
    let asset;
    if (foundAsset) {
        const { idAsset, FileName, FilePath } = foundAsset;

        return {
            id: String(idAsset),
            fileName: FileName,
            filePath: FilePath
        };
    }

    return asset;
}

export default Asset;
