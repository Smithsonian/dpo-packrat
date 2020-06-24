/**
 * Type resolver for CaptureDataFile
 */
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { CaptureDataFile, CaptureData, Asset, Vocabulary } from '../../../../../types/graphql';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { fetchCaptureDataByCaptureDataFileID, fetchAssetByCaptureDataFileID, fetchVocabularyByCaptureDataFileID } from '../../../../../db';
import { parseCaptureData } from './CaptureData';
import { parseVocabulary } from '../../../vocabulary/resolvers/types/Vocabulary';
import { parseAsset } from '../../../asset/resolvers/types/Asset';

const CaptureDataFile = {
    CaptureData: async (parent: Parent, _: Args, context: Context): Promise<CaptureData | null> => {
        const { idCaptureDataFile } = parent;
        const { prisma } = context;

        return resolveCaptureDataByCaptureDataFileID(prisma, Number.parseInt(idCaptureDataFile));
    },
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idCaptureDataFile } = parent;
        const { prisma } = context;

        return resolveAssetByCaptureDataFileID(prisma, Number.parseInt(idCaptureDataFile));
    },
    VVariantType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idCaptureDataFile } = parent;
        const { prisma } = context;

        return resolveVocabularyByCaptureDataFileID(prisma, Number.parseInt(idCaptureDataFile));
    }
};

export async function resolveCaptureDataByCaptureDataFileID(prisma: PrismaClient, idCaptureDataFile: number): Promise<CaptureData | null> {
    const foundCaptureData = await fetchCaptureDataByCaptureDataFileID(prisma, idCaptureDataFile);

    return parseCaptureData(foundCaptureData);
}

export async function resolveAssetByCaptureDataFileID(prisma: PrismaClient, idCaptureDataFile: number): Promise<Asset | null> {
    const foundAsset = await fetchAssetByCaptureDataFileID(prisma, idCaptureDataFile);

    return parseAsset(foundAsset);
}

export async function resolveVocabularyByCaptureDataFileID(prisma: PrismaClient, idCaptureDataFile: number): Promise<Vocabulary | null> {
    const foundVVariantType = await fetchVocabularyByCaptureDataFileID(prisma, idCaptureDataFile);

    return parseVocabulary(foundVVariantType);
}

export function parseCaptureDataFiles(foundCaptureDataFiles: DB.CaptureDataFile[] | null): CaptureDataFile[] | null {
    let captureDataFiles;
    if (foundCaptureDataFiles) {
        captureDataFiles = foundCaptureDataFiles.map(captureDataFile => parseCaptureDataFile(captureDataFile));
    }

    return captureDataFiles;
}

export function parseCaptureDataFile(foundCaptureDataFile: DB.CaptureDataFile | null): CaptureDataFile | null {
    let captureDataFile;
    if (foundCaptureDataFile) {
        const { idCaptureDataFile, CompressedMultipleFiles } = foundCaptureDataFile;
        captureDataFile = {
            idCaptureDataFile: String(idCaptureDataFile),
            CompressedMultipleFiles
        };
    }

    return captureDataFile;
}

export default CaptureDataFile;
