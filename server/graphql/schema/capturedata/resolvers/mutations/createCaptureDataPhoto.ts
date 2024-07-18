import { CreateCaptureDataPhotoResult, MutationCreateCaptureDataPhotoArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function CreateCaptureDataPhoto(_: Parent, args: MutationCreateCaptureDataPhotoArgs): Promise<CreateCaptureDataPhotoResult> {
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
