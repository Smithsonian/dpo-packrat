/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import * as NAV from '../../../../../navigation/interface';
import * as LOG from '../../../../../utils/logger';
import { ColumnDefinition, GetAssetDetailsForSystemObjectResult, QueryGetAssetDetailsForSystemObjectArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import { VocabularyCache } from '../../../../../cache';
import { AssetGridDetailBase } from './AssetGridCommon';
import { AssetGridDetail } from './AssetGridDetail';
import { AssetGridDetailCaptureData } from './AssetGridDetailCaptureData';

enum eAssetGridType {
    eStandard,
    eCaptureData,
}

export default async function getAssetDetailsForSystemObject(_: Parent, args: QueryGetAssetDetailsForSystemObjectArgs): Promise<GetAssetDetailsForSystemObjectResult> {
    const { input } = args;
    const { idSystemObject } = input;

    let columns: ColumnDefinition[] = [];
    const assetDetailRows: any[] = [];
    const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchLatestFromSystemObject(idSystemObject);
    if (!assetVersions) {
        LOG.info(`getAssetDetailsForSystemObject retrieved no asset versions for ${idSystemObject}`, LOG.LS.eGQL);
        return { columns, assetDetailRows };
    }

    const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
    if (!SO) {
        LOG.info(`getAssetDetailsForSystemObject unable to retrieve system object for ${idSystemObject}`, LOG.LS.eGQL);
        return { columns, assetDetailRows };
    }

    let eGridType: eAssetGridType = eAssetGridType.eStandard;
    const metadataMetaMap: Map<number, Map<string, string>> = new Map<number, Map<string, string>>(); // map of asset version idSystemObject -> map of metadata name, value pairs
    if (!SO.idCaptureData) {
        eGridType = eAssetGridType.eStandard;
        columns = AssetGridDetail.getColumns();
    } else {
        eGridType = eAssetGridType.eCaptureData;
        columns = AssetGridDetailCaptureData.getColumns();

        // Query solr for metadata belonging to asset versions that are children of this capture data set
        // Process results, creating a map from idSystemObject of asset version -> { a map of { metadata name -> value } }
        const navigation: NAV.INavigation | null = await NAV.NavigationFactory.getInstance();
        if (navigation) {
            const metadataColumns: string[] = ['variant', 'iso', 'lens', 'fnumber', 'imageheight', 'imagewidth'];
            const metadataFilter: NAV.MetadataFilter = { idRoot: idSystemObject, forAssetChildren: true, metadataColumns };
            const metadataResult: NAV.MetadataResult = await navigation.getMetadata(metadataFilter);
            const metadataColLen: number = metadataFilter.metadataColumns.length;
            if (metadataResult.success) {
                for (const metadataEntry of metadataResult.entries) {
                    if (metadataEntry.metadata.length != metadataColLen) {
                        LOG.error(`getAssetDetailsForSystemObject INavigation.getMetadata returned the wrong number of columns (${metadataEntry.metadata.length} instead of ${metadataColLen})`, LOG.LS.eGQL);
                        continue;
                    }

                    let metadataMap: Map<string, string> | undefined = metadataMetaMap.get(metadataEntry.idSystemObject);
                    if (!metadataMap) {
                        metadataMap = new Map<string, string>();
                        metadataMetaMap.set(metadataEntry.idSystemObject, metadataMap);
                    }

                    for (let index: number = 0; index < metadataColLen; index++)
                        metadataMap.set(metadataColumns[index].toLowerCase(), metadataEntry.metadata[index]);
                }
            } else
                LOG.error(`getAssetDetailsForSystemObject INavigation.getMetadata failed: ${metadataResult.error}`, LOG.LS.eGQL);
        }
    }

    let assetDetailPreferred: AssetGridDetailBase | null = null;
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

        let assetDetail: AssetGridDetailBase | null = null;
        switch (eGridType) {
            default:
            case eAssetGridType.eStandard: {
                const vocabulary: DBAPI.Vocabulary | undefined = await VocabularyCache.vocabulary(asset.idVAssetType);
                if (!vocabulary) {
                    LOG.error(`vocabularyCache could not retrieve vocabulary for asset ${JSON.stringify(asset.idAsset)}`, LOG.LS.eGQL);
                    continue;
                }

                assetDetail = new AssetGridDetail(asset, assetVersion, sID.idSystemObject, vocabulary);
            }   break;

            case eAssetGridType.eCaptureData: {
                // We need the idSystemObject for the asset version
                const oIDAV: DBAPI.ObjectIDAndType = { idObject: assetVersion.idAssetVersion, eObjectType: DBAPI.eSystemObjectType.eAssetVersion };
                const sIDAV: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oIDAV);
                let metadataMap: Map<string, string> | undefined = undefined;
                if (sIDAV)
                    metadataMap = metadataMetaMap.get(sIDAV.idSystemObject);
                else
                    LOG.error(`getAssetDetailsForSystemObject could not retrieve system object info for ${JSON.stringify(oIDAV)}`, LOG.LS.eGQL);

                if (!metadataMap)
                    metadataMap = new Map<string, string>();

                assetDetail = new AssetGridDetailCaptureData(asset, assetVersion, sID.idSystemObject, metadataMap);
            }   break;
        }

        // If we haven't yet identified a preferred assetDetail record, examine this asset's asset type,
        // and compare that to the system object that we've fetched.
        if (!assetDetailPreferred) {
            if (await isPreferredAsset(asset.idVAssetType, SO)) {
                assetDetailPreferred = assetDetail;
                continue;
            }
        }

        assetDetailRows.push(assetDetail);
    }

    if (assetDetailPreferred)
        assetDetailRows.unshift(assetDetailPreferred);

    return { columns, assetDetailRows };
}

async function isPreferredAsset(idVAssetType: number, SO: DBAPI.SystemObject): Promise<boolean> {
    switch (await CACHE.VocabularyCache.vocabularyIdToEnum(idVAssetType)) {
        case CACHE.eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry:
        case CACHE.eVocabularyID.eAssetAssetTypeCaptureDataSetDiconde:
        case CACHE.eVocabularyID.eAssetAssetTypeCaptureDataSetDicom:
        case CACHE.eVocabularyID.eAssetAssetTypeCaptureDataSetLaserLine:
        case CACHE.eVocabularyID.eAssetAssetTypeCaptureDataSetSphericalLaser:
        case CACHE.eVocabularyID.eAssetAssetTypeCaptureDataSetStructuredLight:
        case CACHE.eVocabularyID.eAssetAssetTypeCaptureDataSetOther:
            return SO.idCaptureData ? true : false;

        case CACHE.eVocabularyID.eAssetAssetTypeModel:
        case CACHE.eVocabularyID.eAssetAssetTypeModelGeometryFile:
            return SO.idModel ? true : false;

        case CACHE.eVocabularyID.eAssetAssetTypeScene:
            return SO.idScene ? true : false;

        case CACHE.eVocabularyID.eAssetAssetTypeProjectDocumentation:
            return SO.idProjectDocumentation ? true : false;

        case CACHE.eVocabularyID.eAssetAssetTypeIntermediaryFile:
            return SO.idIntermediaryFile ? true : false;

        case CACHE.eVocabularyID.eAssetAssetTypeBulkIngestion:
        case CACHE.eVocabularyID.eAssetAssetTypeCaptureDataFile:
        case CACHE.eVocabularyID.eAssetAssetTypeModelUVMapFile:
        case CACHE.eVocabularyID.eAssetAssetTypeOther:
        case undefined:
        default:
            return false;
    }
}