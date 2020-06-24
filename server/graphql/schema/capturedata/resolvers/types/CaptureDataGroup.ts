/**
 * Type resolver for CaptureDataGroup
 */
import * as DB from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { CaptureDataGroup, CaptureData } from '../../../../../types/graphql';
import { fetchCaptureDataForCaptureDataGroupID } from '../../../../../db';
import { parseCaptureDatas } from './CaptureData';

const CaptureDataGroup = {
    CaptureData: async (parent: Parent, _: Args, context: Context): Promise<CaptureData[] | null> => {
        const { idCaptureDataGroup } = parent;
        const { prisma } = context;

        return resolveCaptureDataByCaptureDataGroupID(prisma, Number.parseInt(idCaptureDataGroup));
    }
};

export async function resolveCaptureDataByCaptureDataGroupID(prisma: DB.PrismaClient, idCaptureDataGroup: number): Promise<CaptureData[] | null> {
    const foundCaptureData = await fetchCaptureDataForCaptureDataGroupID(prisma, idCaptureDataGroup);

    return parseCaptureDatas(foundCaptureData);
}

export function parseCaptureDataGroups(foundCaptureDataGroups: DB.CaptureDataGroup[] | null): CaptureDataGroup[] | null {
    let captureDataGroups;
    if (foundCaptureDataGroups) {
        captureDataGroups = foundCaptureDataGroups.map(captureDataGroup => parseCaptureDataGroup(captureDataGroup));
    }

    return captureDataGroups;
}

export function parseCaptureDataGroup(foundCaptureDataGroup: DB.CaptureDataGroup | null): CaptureDataGroup | null {
    let captureDataGroup;
    if (foundCaptureDataGroup) {
        const { idCaptureDataGroup } = foundCaptureDataGroup;
        captureDataGroup = {
            idCaptureDataGroup: String(idCaptureDataGroup)
        };
    }

    return captureDataGroup;
}

export default CaptureDataGroup;
