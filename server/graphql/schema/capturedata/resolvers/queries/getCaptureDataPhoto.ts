import { GetCaptureDataPhotoResult, GetCaptureDataPhotoInput } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

type Args = { input: GetCaptureDataPhotoInput };

export default async function getCaptureData(_: Parent, args: Args): Promise<GetCaptureDataPhotoResult> {
    const { input } = args;
    const { idCaptureDataPhoto } = input;

    const CaptureDataPhoto = await DBAPI.CaptureDataPhoto.fetch(idCaptureDataPhoto);

    return { CaptureDataPhoto };
}
