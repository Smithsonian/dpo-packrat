import { GetUploadedAssetVersionResult, UpdatedAssetVersionMetadata, UpdatePhotogrammetryMetadata, UpdateModelMetadata, UpdateSceneMetadata, IngestFolder, Item } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
// import * as H from '../../../../../utils/helpers';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

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
        RK.logError(RK.LogSection.eGQL,'get uploaded asset version failed','cannot fetch asset versions by user',{},'GraphQL.Asset');
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
        RK.logError(RK.LogSection.eGQL,'get uploaded asset version failed','cannot compute version counts',{ idAssets },'GraphQL.Asset');
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
                RK.logError(RK.LogSection.eGQL,'get uploaded asset version failed',`skipping unexpected idAsset ${idAsset}`,{},'GraphQL.Asset');
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
        RK.logError(RK.LogSection.eGQL,'compute updated version metadata failed',`cannot retrieve idAsset ${idAsset}`,{ idAssetVersion },'GraphQL.Asset');
        return null;
    }
    if (!asset.idSystemObject)
        return null;
    const SOP: DBAPI.SystemObjectPairs | null = await DBAPI.SystemObjectPairs.fetch(asset.idSystemObject);
    if (!SOP) {
        RK.logError(RK.LogSection.eGQL,'compute updated version metadata failed','failed to retrieve system object info from asset',{ idAssetVersion, asset },'GraphQL.Asset');
        return null;
    }

    // How do we compute the name of a generic system object?
    // UpdatedObjectName: String!
    const UpdatedObjectName: string = await CACHE.SystemObjectCache.getObjectNameByID(asset.idSystemObject) ?? 'UNKNOWN';
    let Item: Item | undefined = undefined;
    const OG: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(asset.idSystemObject, DBAPI.eObjectGraphMode.eAncestors);
    if (await OG.fetch()) {
        if (OG.item && OG.item.length === 1)
            Item = OG.item[0];
    } else
        RK.logError(RK.LogSection.eGQL,'compute updated version metadata failed',`failed to retrieve object graph for asset owner ${asset.idSystemObject}`,{ idAssetVersion },'GraphQL.Asset');


    let CaptureDataPhoto: UpdatePhotogrammetryMetadata | undefined = undefined;
    let Model: UpdateModelMetadata | undefined = undefined;
    let Scene: UpdateSceneMetadata | undefined = undefined;
    if (SOP.CaptureData) {
        const CDPs: DBAPI.CaptureDataPhoto[] | null = await DBAPI.CaptureDataPhoto.fetchFromCaptureData(SOP.CaptureData.idCaptureData);
        if (CDPs && CDPs.length > 0) {
            const folders: IngestFolder[] = [];
            const folderVariantMap: Map<string, number | null> | null = await DBAPI.CaptureDataFile.fetchFolderVariantMapFromCaptureData(SOP.CaptureData.idCaptureData);
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
                folders,
                datasetUse: CDP.CaptureDatasetUse ?? '[207,208,209]' // indices into Vocabulary: alignment, reconstruction, texture generation
            };
        } else {
            RK.logError(RK.LogSection.eGQL,'compute updated version metadata failed','failed to retrieve CaptureDataPhoto from system object pair',{ idAssetVersion, captureData: SOP.CaptureData },'GraphQL.Asset');
            return null;
        }
    } else if (SOP.Model) {
        Model = {
            name: SOP.Model.Name,
            creationMethod: SOP.Model.idVCreationMethod ?? 0,
            modality: SOP.Model.idVModality ?? 0,
            purpose: SOP.Model.idVPurpose ?? 0,
            units: SOP.Model.idVUnits ?? 0,
            dateCreated: (SOP.Model.DateCreated ?? new Date()).toISOString(),
            modelFileType: SOP.Model.idVFileType ?? 0,
            Variant: SOP.Model.Variant ?? '[]'
        };
    } else if (SOP.Scene) {
        Scene = {
            name: SOP.Scene.Name,
            approvedForPublication: SOP.Scene.ApprovedForPublication,
            posedAndQCd: SOP.Scene.PosedAndQCd
        };
    }

    return {
        idAssetVersion,
        UpdatedObjectName,
        Item,
        CaptureDataPhoto,
        Model,
        Scene
    };
}