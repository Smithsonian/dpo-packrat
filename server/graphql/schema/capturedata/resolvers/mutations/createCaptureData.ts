import { CreateCaptureDataResult, MutationCreateCaptureDataArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function CreateCaptureData(_: Parent, args: MutationCreateCaptureDataArgs): Promise<CreateCaptureDataResult> {
    const { input } = args;
    const {
        idVCaptureMethod,
        idVCaptureDatasetType,
        DateCaptured,
        Description,
        CaptureDatasetFieldID,
        ItemPositionFieldID,
        ItemArrangementFieldID,
        idVBackgroundRemovalMethod,
        ClusterGeometryFieldID,
        CameraSettingsUniform,
        idAssetThumbnail,
        idVItemPositionType,
        idVFocusType,
        idVLightSourceType,
        idVClusterType
    } = input;

    const captureDataArgs = {
        idCaptureData: 0,
        idVCaptureMethod,
        idVCaptureDatasetType,
        DateCaptured,
        Description,
        CaptureDatasetFieldID,
        ItemPositionFieldID,
        ItemArrangementFieldID,
        idVBackgroundRemovalMethod,
        ClusterGeometryFieldID,
        CameraSettingsUniform,
        idAssetThumbnail: idAssetThumbnail || null,
        idVItemPositionType: idVItemPositionType || null,
        idVFocusType: idVFocusType || null,
        idVLightSourceType: idVLightSourceType || null,
        idVClusterType: idVClusterType || null
    };

    const CaptureData = new DBAPI.CaptureData(captureDataArgs);
    await CaptureData.create();

    return { CaptureData };
}
