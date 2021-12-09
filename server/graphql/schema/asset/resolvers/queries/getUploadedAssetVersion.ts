import { GetUploadedAssetVersionResult, UpdatedAssetVersionMetadata, UpdatePhotogrammetryMetadata, UpdateModelMetadata, UpdateSceneMetadata, IngestFolder } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';
import * as H from '../../../../../utils/helpers';

export default async function getUploadedAssetVersion(_: Parent, __: unknown, context: Context): Promise<GetUploadedAssetVersionResult> {
    const { user } = context;
    if (!user)
        return { AssetVersion: [], idAssetVersionsUpdated: [], UpdatedAssetVersionMetadata: [] };
    const { idUser } = user;

    // fetch asset versions that have "false" for ingested and are not retired for this user.
    // Note that there may be some asset versions with "null" for ingested, which we are ignoring --
    // these have been uploaded but are still being processed in a post-upload workflow
    const AssetVersion: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchFromUserByIngested(idUser, false, false);
    if (!AssetVersion) {
        LOG.error(`getUploadedAssetVersion failed on AssetVersion.fetchFromUserByIngested(${idUser}, false, false)`, LOG.LS.eGQL);
        return { AssetVersion: [], idAssetVersionsUpdated: [], UpdatedAssetVersionMetadata: [] };
    }
    if (AssetVersion.length == 0)
        return { AssetVersion: [], idAssetVersionsUpdated: [], UpdatedAssetVersionMetadata: [] };

    // compute map of idAsset -> idAssetVersion for asset versions
    const assetMap: Map<number, number> = new Map<number, number>();
    for (const assetVersion of AssetVersion)
        assetMap.set(assetVersion.idAsset, assetVersion.idAssetVersion);

    // compute asset version counts for each asset
    const idAssets: number[] = [ ...assetMap.keys() ];
    const versionCountMap: Map<number, number> | null = await DBAPI.Asset.computeVersionCountMap(idAssets);
    if (!versionCountMap) {
        LOG.error(`getUploadedAssetVersion failed on Asset.computeVersionCountMap(${JSON.stringify(idAssets)})`, LOG.LS.eGQL);
        return { AssetVersion: [], idAssetVersionsUpdated: [], UpdatedAssetVersionMetadata: [] };
    }

    // let caller know which asset versions are updates -- those with version counts > 1
    const idAssetVersionsUpdated: number[] = [];
    const UpdatedAssetVersionMetadata: UpdatedAssetVersionMetadata[] = [];
    for (const [key, value] of versionCountMap) {
        const idAsset: number = key;
        const versionCount: number = value;
        if (versionCount > 1) {
            const idAssetVersion: number | undefined = assetMap.get(idAsset);
            if (idAssetVersion === undefined) {
                LOG.error(`getUploadedAssetVersion skipping unexpected idAsset ${idAsset}`, LOG.LS.eGQL);
                continue;
            }
            idAssetVersionsUpdated.push(idAssetVersion);

            // for each updated asset version, fetch and populate ingestion metadata
            const updateMetadata: UpdatedAssetVersionMetadata | null = await computeUpdatedVersionMetadata(idAssetVersion, idAsset);
            if (updateMetadata)
                UpdatedAssetVersionMetadata.push(updateMetadata);
        }
    }

    // LOG.info(`getUploadedAssetVersion returning AssetVersion=${JSON.stringify(AssetVersion, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
    return { AssetVersion, idAssetVersionsUpdated, UpdatedAssetVersionMetadata };
}

async function computeUpdatedVersionMetadata(idAssetVersion: number, idAsset: number): Promise<UpdatedAssetVersionMetadata | null> {
    const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(idAsset);
    if (!asset) {
        LOG.error(`getUploadedAssetVersion failed to retrieve idAsset ${idAsset}`, LOG.LS.eGQL);
        return null;
    }
    if (!asset.idSystemObject)
        return null;
    const SOP: DBAPI.SystemObjectPairs | null = await DBAPI.SystemObjectPairs.fetch(asset.idSystemObject);
    if (!SOP) {
        LOG.error(`getUploadedAssetVersion failed to retrieve system object info from ${JSON.stringify(asset, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
        return null;
    }

    let CaptureDataPhoto: UpdatePhotogrammetryMetadata | undefined = undefined;
    let Model: UpdateModelMetadata | undefined = undefined;
    let Scene: UpdateSceneMetadata | undefined = undefined;
    if (SOP.CaptureData) {
        const CDPs: DBAPI.CaptureDataPhoto[] | null = await DBAPI.CaptureDataPhoto.fetchFromCaptureData(SOP.CaptureData.idCaptureData);
        if (CDPs && CDPs.length > 0) {
            const folders: IngestFolder[] = [];
            const folderVariantMap: Map<string, number> | null = await DBAPI.CaptureDataFile.fetchFolderVariantMapFromCaptureData(SOP.CaptureData.idCaptureData);
            if (folderVariantMap) {
                for (const [name, variantType] of folderVariantMap)
                    folders.push({ name, variantType });
            }

            const CDP: DBAPI.CaptureDataPhoto = CDPs[0];
            CaptureDataPhoto = {
                name: SOP.CaptureData.Name,
                dateCaptured: SOP.CaptureData.DateCaptured.toISOString(),
                datasetType: CDP.idVCaptureDatasetType,
                description: SOP.CaptureData.Description,
                cameraSettingUniform: CDP.CameraSettingsUniform ?? false,
                datasetFieldId: CDP.CaptureDatasetFieldID,
                itemPositionType: CDP.idVItemPositionType,
                itemPositionFieldId: CDP.ItemPositionFieldID,
                itemArrangementFieldId: CDP.ItemArrangementFieldID,
                focusType: CDP.idVFocusType,
                lightsourceType: CDP.idVLightSourceType,
                backgroundRemovalMethod: CDP.idVBackgroundRemovalMethod,
                clusterType: CDP.idVClusterType,
                clusterGeometryFieldId: CDP.ClusterGeometryFieldID,
                folders
            };
        } else {
            LOG.error(`getUploadedAssetVersion failed to retrieve CaptureDataPhoto from ${JSON.stringify(SOP.CaptureData, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
            return null;
        }
    } else if (SOP.Model) {
        Model = {
            name: SOP.Model.Name,
            creationMethod: SOP.Model.idVCreationMethod ?? 0,
            modality: SOP.Model.idVModality ?? 0,
            purpose: SOP.Model.idVPurpose ?? 0,
            units: SOP.Model.idVUnits ?? 0,
            dateCaptured: (SOP.Model.DateCreated ?? new Date()).toISOString(),
            modelFileType: SOP.Model.idVFileType ?? 0
        };
    } else if (SOP.Scene) {
        Scene = {
            name: SOP.Scene.Name,
            approvedForPublication: SOP.Scene.ApprovedForPublication,
            posedAndQCd: SOP.Scene.PosedAndQCd
        };
    }
    if (CaptureDataPhoto || Model || Scene) {
        return {
            idAssetVersion,
            CaptureDataPhoto,
            Model,
            Scene
        };
    }
    return null;
}