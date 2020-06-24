/**
 * Type resolver for Asset
 */
import { fetchAsset, fetchAssetGroupForAssetID, fetchCaptureDataFileForAssetID, fetchSceneForAssetID, fetchIntermediaryFileForAssetID } from '../../../../../db';
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Asset, AssetGroup, CaptureDataFile, Scene, IntermediaryFile } from '../../../../../types/graphql';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { parseAssetGroup } from './AssetGroup';
import { parseCaptureDataFiles } from '../../../capturedata/resolvers/types/CaptureDataFile';
import { parseScenes } from '../../../scene/resolvers/types/Scene';
import { parseIntermediaryFiles } from '../../../scene/resolvers/types/IntermediaryFile';

const Asset = {
    AssetGroup: async (parent: Parent, _: Args, context: Context): Promise<AssetGroup | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveAssetGroupByAssetID(prisma, Number.parseInt(id));
    },
    CaptureDataFile: async (parent: Parent, _: Args, context: Context): Promise<CaptureDataFile[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveCaptureDataFileByAssetID(prisma, Number.parseInt(id));
    },
    Scene: async (parent: Parent, _: Args, context: Context): Promise<Scene[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveSceneByAssetID(prisma, Number.parseInt(id));
    },
    IntermediaryFile: async (parent: Parent, _: Args, context: Context): Promise<IntermediaryFile[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveIntermediaryFileByAssetID(prisma, Number.parseInt(id));
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

export async function resolveCaptureDataFileByAssetID(prisma: PrismaClient, assetId: number): Promise<CaptureDataFile[] | null> {
    const foundCaptureDataFiles = await fetchCaptureDataFileForAssetID(prisma, assetId);

    return parseCaptureDataFiles(foundCaptureDataFiles);
}

export async function resolveSceneByAssetID(prisma: PrismaClient, assetId: number): Promise<Scene[] | null> {
    const foundScenes = await fetchSceneForAssetID(prisma, assetId);

    return parseScenes(foundScenes);
}

export async function resolveIntermediaryFileByAssetID(prisma: PrismaClient, assetId: number): Promise<IntermediaryFile[] | null> {
    const foundIntermediaryFiles = await fetchIntermediaryFileForAssetID(prisma, assetId);

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
            idAsset: String(idAsset),
            FileName,
            FilePath
        };
    }

    return asset;
}

export default Asset;
