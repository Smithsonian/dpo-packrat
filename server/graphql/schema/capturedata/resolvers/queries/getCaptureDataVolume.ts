import { GetCaptureDataVolumeResult, GetCaptureDataVolumeInput } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

type Args = { input: GetCaptureDataVolumeInput };

export default async function getCaptureDataVolume(_: Parent, args: Args): Promise<GetCaptureDataVolumeResult> {
    const { input } = args;
    const { idCaptureDataVolume } = input;

    const CaptureDataVolume = await DBAPI.CaptureDataVolume.fetch(idCaptureDataVolume);

    return { CaptureDataVolume };
}
