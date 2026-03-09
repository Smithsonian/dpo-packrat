import { CreateCaptureDataResult, MutationCreateCaptureDataArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';

export default async function CreateCaptureData(_: Parent, args: MutationCreateCaptureDataArgs): Promise<CreateCaptureDataResult> {
    const ctx = Authorization.getContext();
    if (!ctx || (!ctx.isAdmin && ctx.authorizedUnitIds.length === 0))
        throw new Error(AUTH_ERROR.ACCESS_DENIED);

    const { input } = args;
    const {
        Name,
        idVCaptureMethod,
        DateCaptured,
        Description,
        idAssetThumbnail
    } = input;

    const captureDataArgs = {
        idCaptureData: 0,
        Name,
        idVCaptureMethod,
        DateCaptured,
        Description,
        idAssetThumbnail: idAssetThumbnail || null
    };

    const CaptureData = new DBAPI.CaptureData(captureDataArgs);
    await CaptureData.create();

    return { CaptureData };
}
