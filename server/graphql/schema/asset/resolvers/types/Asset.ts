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
        const { idAsset } = parent;
        const { prisma } = context;

        return resolveAssetGroupByAssetID(prisma, Number.parseInt(idAsset));
    },
    CaptureDataFile: async (parent: Parent, _: Args, context: Context): Promise<CaptureDataFile[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return resolveCaptureDataFileByAssetID(prisma, Number.parseInt(idAsset));
    },
    Scene: async (parent: Parent, _: Args, context: Context): Promise<Scene[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return resolveSceneByAssetID(prisma, Number.parseInt(idAsset));
    },
    IntermediaryFile: async (parent: Parent, _: Args, context: Context): Promise<IntermediaryFile[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return resolveIntermediaryFileByAssetID(prisma, Number.parseInt(idAsset));
    }
};

export async function resolveAssetByID(prisma: PrismaClient, idAssetGroup: number): Promise<Asset | null> {
    const foundAsset = await fetchAsset(prisma, idAssetGroup);

    return parseAsset(foundAsset);
}

export async function resolveAssetGroupByAssetID(prisma: PrismaClient, idAssetGroup: number): Promise<AssetGroup | null> {
    const foundAssetGroup = await fetchAssetGroupForAssetID(prisma, idAssetGroup);

    return parseAssetGroup(foundAssetGroup);
}

export async function resolveCaptureDataFileByAssetID(prisma: PrismaClient, idAssetGroup: number): Promise<CaptureDataFile[] | null> {
    const foundCaptureDataFiles = await fetchCaptureDataFileForAssetID(prisma, idAssetGroup);

    return parseCaptureDataFiles(foundCaptureDataFiles);
}

export async function resolveSceneByAssetID(prisma: PrismaClient, idAssetGroup: number): Promise<Scene[] | null> {
    const foundScenes = await fetchSceneForAssetID(prisma, idAssetGroup);

    return parseScenes(foundScenes);
}

export async function resolveIntermediaryFileByAssetID(prisma: PrismaClient, idAssetGroup: number): Promise<IntermediaryFile[] | null> {
    const foundIntermediaryFiles = await fetchIntermediaryFileForAssetID(prisma, idAssetGroup);

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
