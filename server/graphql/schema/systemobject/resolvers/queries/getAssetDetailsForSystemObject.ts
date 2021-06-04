import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import * as LOG from '../../../../../utils/logger';
import { AssetDetail, GetAssetDetailsForSystemObjectResult, QueryGetAssetDetailsForSystemObjectArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';

export default async function getAssetDetailsForSystemObject(_: Parent, args: QueryGetAssetDetailsForSystemObjectArgs): Promise<GetAssetDetailsForSystemObjectResult> {
    const { input } = args;
    const { idSystemObject } = input;

    const assetDetails: AssetDetail[] = [];
    const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchLatestFromSystemObject(idSystemObject);
    if (!assetVersions) {
        LOG.info(`getAssetDetailsForSystemObject retrieved no asset versions for ${idSystemObject}`, LOG.LS.eGQL);
        return { assetDetails };
    }

    const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
    if (!SO) {
        LOG.info(`getAssetDetailsForSystemObject unable to retrieve system object for ${idSystemObject}`, LOG.LS.eGQL);
        return { assetDetails };
    }

    let assetDetailPreferred: AssetDetail | null = null;
    for (const assetVersion of assetVersions) {
        // We need the idSystemObject for the asset
        const oID: DBAPI.ObjectIDAndType = { idObject: assetVersion.idAsset, eObjectType: DBAPI.eSystemObjectType.eAsset };
        const sID: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
        if (!sID) {
            LOG.error(`getAssetDetailsForSystemObject could not retrieve system object info for ${JSON.stringify(oID)}`, LOG.LS.eGQL);
            continue;
        }

        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
        if (!asset) {
            LOG.error(`getAssetDetailsForSystemObject could not retrieve asset for id ${JSON.stringify(assetVersion.idAsset)}`, LOG.LS.eGQL);
            continue;
        }

        const assetDetail: AssetDetail = {
            idSystemObject: sID ? sID.idSystemObject : 0,
            idAsset: assetVersion.idAsset,
            idAssetVersion: assetVersion.idAssetVersion,
            name: assetVersion.FileName,
            path: asset.FilePath,
            assetType: asset.idVAssetType,
            version: assetVersion.Version,
            dateCreated: assetVersion.DateCreated,
            size: assetVersion.StorageSize
        };

        // If we haven't yet identified a preferred assetDetail record, examine this asset's asset type,
        // and compare that to the system object that we've fetched.
        if (!assetDetailPreferred) {
            switch (await CACHE.VocabularyCache.vocabularyIdToEnum(asset.idVAssetType)) {
                case CACHE.eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry:
                case CACHE.eVocabularyID.eAssetAssetTypeCaptureDataSetDiconde:
                case CACHE.eVocabularyID.eAssetAssetTypeCaptureDataSetDicom:
                case CACHE.eVocabularyID.eAssetAssetTypeCaptureDataSetLaserLine:
                case CACHE.eVocabularyID.eAssetAssetTypeCaptureDataSetSphericalLaser:
                case CACHE.eVocabularyID.eAssetAssetTypeCaptureDataSetStructuredLight:
                case CACHE.eVocabularyID.eAssetAssetTypeCaptureDataSetOther:
                    if (SO.idCaptureData) {
                        assetDetailPreferred = assetDetail;
                        continue;
                    }
                    break;

                case CACHE.eVocabularyID.eAssetAssetTypeModel:
                case CACHE.eVocabularyID.eAssetAssetTypeModelGeometryFile:
                    if (SO.idModel) {
                        assetDetailPreferred = assetDetail;
                        continue;
                    }
                    break;

                case CACHE.eVocabularyID.eAssetAssetTypeScene:
                    if (SO.idScene) {
                        assetDetailPreferred = assetDetail;
                        continue;
                    }
                    break;

                case CACHE.eVocabularyID.eAssetAssetTypeProjectDocumentation:
                    if (SO.idProjectDocumentation) {
                        assetDetailPreferred = assetDetail;
                        continue;
                    }
                    break;

                case CACHE.eVocabularyID.eAssetAssetTypeIntermediaryFile:
                    if (SO.idIntermediaryFile) {
                        assetDetailPreferred = assetDetail;
                        continue;
                    }
                    break;

                case CACHE.eVocabularyID.eAssetAssetTypeBulkIngestion:
                case CACHE.eVocabularyID.eAssetAssetTypeCaptureDataFile:
                case CACHE.eVocabularyID.eAssetAssetTypeModelUVMapFile:
                case CACHE.eVocabularyID.eAssetAssetTypeOther:
                case undefined:
                    break;
            }
        }

        assetDetails.push(assetDetail);
    }

    if (assetDetailPreferred)
        assetDetails.unshift(assetDetailPreferred);

    return { assetDetails };
}