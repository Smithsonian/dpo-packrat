import { CreateCaptureDataResult, MutationCreateCaptureDataArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function CreateCaptureData(_: Parent, args: MutationCreateCaptureDataArgs): Promise<CreateCaptureDataResult> {
    const { input } = args;
    const {
        idVCaptureMethod,
        DateCaptured,
        Description,
        idAssetThumbnail
    } = input;

    const captureDataArgs = {
        idCaptureData: 0,
        idVCaptureMethod,
        DateCaptured,
        Description,
        idAssetThumbnail: idAssetThumbnail || null
    };

    const CaptureData = new DBAPI.CaptureData(captureDataArgs);
    await CaptureData.create();

    return { CaptureData };
}
