import { GetCaptureDataResult, GetCaptureDataInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { resolveCaptureDataByID } from '../types/CaptureData';

type Args = { input: GetCaptureDataInput };

export default async function getCaptureData(_: Parent, args: Args, context: Context): Promise<GetCaptureDataResult> {
    const { input } = args;
    const { idCaptureData } = input;
    const { prisma } = context;

    const CaptureData = await resolveCaptureDataByID(prisma, Number.parseInt(idCaptureData));

    if (CaptureData) {
        return { CaptureData };
    }

    return { CaptureData: null };
}
