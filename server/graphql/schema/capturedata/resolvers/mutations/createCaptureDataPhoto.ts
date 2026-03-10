import { CreateCaptureDataPhotoResult, MutationCreateCaptureDataPhotoArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';

export default async function CreateCaptureDataPhoto(_: Parent, args: MutationCreateCaptureDataPhotoArgs): Promise<CreateCaptureDataPhotoResult> {
    const ctx = Authorization.getContext();
    if (!ctx || (!ctx.isAdmin && ctx.authorizedUnitIds.length === 0))
        throw new Error(AUTH_ERROR.ACCESS_DENIED);

    const { input } = args;
    const {
        idCaptureData,
        idVCaptureDatasetType,
        CaptureDatasetFieldID,
        ItemPositionFieldID,
        ItemArrangementFieldID,
        idVBackgroundRemovalMethod,
        ClusterGeometryFieldID,
        CameraSettingsUniform,
        idVItemPositionType,
        idVFocusType,
        idVLightSourceType,
        idVClusterType,
        CaptureDatasetUse,
    } = input;

    const captureDataPhotoArgs = {
        idCaptureDataPhoto: 0,
        idCaptureData,
        idVCaptureDatasetType,
        CaptureDatasetFieldID,
        ItemPositionFieldID,
        ItemArrangementFieldID,
        idVBackgroundRemovalMethod,
        ClusterGeometryFieldID,
        CameraSettingsUniform,
        idVItemPositionType: idVItemPositionType || null,
        idVFocusType: idVFocusType || null,
        idVLightSourceType: idVLightSourceType || null,
        idVClusterType: idVClusterType || null,
        CaptureDatasetUse,
    };

    const CaptureDataPhoto = new DBAPI.CaptureDataPhoto(captureDataPhotoArgs);
    await CaptureDataPhoto.create();

    return { CaptureDataPhoto };
}
