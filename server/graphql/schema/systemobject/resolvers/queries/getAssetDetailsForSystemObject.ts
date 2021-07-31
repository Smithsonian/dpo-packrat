/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import * as LOG from '../../../../../utils/logger';
import { GetAssetDetailsForSystemObjectResult, QueryGetAssetDetailsForSystemObjectArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import { AssetGridDetail } from './AssetGridDetail';
import { VocabularyCache } from '../../../../../cache';

export enum eIcon {
    eIconDownload = 1
}

export enum eLinkOrigin {
    eClient = 1,
    eServer = 2,
    eNone = 0
}

export default async function getAssetDetailsForSystemObject(_: Parent, args: QueryGetAssetDetailsForSystemObjectArgs): Promise<GetAssetDetailsForSystemObjectResult> {
    const { input } = args;
    const { idSystemObject } = input;

    const assetDetailRows: any[] = [];
    const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchLatestFromSystemObject(idSystemObject);
    if (!assetVersions) {
        LOG.info(`getAssetDetailsForSystemObject retrieved no asset versions for ${idSystemObject}`, LOG.LS.eGQL);
        return { columns: [], assetDetailRows };
    }

    const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
    if (!SO) {
        LOG.info(`getAssetDetailsForSystemObject unable to retrieve system object for ${idSystemObject}`, LOG.LS.eGQL);
        return { columns: [], assetDetailRows };
    }

    let assetDetailPreferred: AssetGridDetail | null = null;
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

        const vocabularyCache = await VocabularyCache.vocabulary(asset.idVAssetType);
        if (!vocabularyCache?.Term) {
            LOG.error(`vocabularyCache could not retrieve vocabulary for asset ${JSON.stringify(asset.idAsset)}`, LOG.LS.eGQL);
            continue;
        }

        const assetDetail = new AssetGridDetail({
            idSystemObject: sID ? sID.idSystemObject : 0,
            idAsset: assetVersion.idAsset,
            idAssetVersion: assetVersion.idAssetVersion,
            name: { label: assetVersion.FileName, path: `${sID.idSystemObject}`, icon: null, origin: eLinkOrigin.eClient },
            link: { label: null, path: `${assetVersion.idAssetVersion}`, icon: eIcon.eIconDownload, origin: eLinkOrigin.eServer },
            filePath: asset.FilePath,
            assetType: vocabularyCache.Term,
            version: assetVersion.Version,
            dateCreated: assetVersion.DateCreated,
            size: assetVersion.StorageSize.toString()
        });

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

        assetDetailRows.push(assetDetail);
    }

    if (assetDetailPreferred) assetDetailRows.unshift(assetDetailPreferred);

    return { columns: AssetGridDetail.getColumns(), assetDetailRows };
}