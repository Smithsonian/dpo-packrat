import { GetCaptureDataResult, GetCaptureDataInput } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

type Args = { input: GetCaptureDataInput };

export default async function getCaptureData(_: Parent, args: Args): Promise<GetCaptureDataResult> {
    const { input } = args;
    const { idCaptureData } = input;

    const CaptureData = await DBAPI.CaptureData.fetch(idCaptureData);

    return { CaptureData };
}
