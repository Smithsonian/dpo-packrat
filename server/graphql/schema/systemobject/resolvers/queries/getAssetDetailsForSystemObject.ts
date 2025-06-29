/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import * as NAV from '../../../../../navigation/interface';
import { ColumnDefinition, GetAssetDetailsForSystemObjectResult, QueryGetAssetDetailsForSystemObjectArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import { VocabularyCache } from '../../../../../cache';
import { AssetGridDetailBase } from './AssetGridCommon';
import { AssetGridDetail } from './AssetGridDetail';
import { AssetGridDetailCaptureData } from './AssetGridDetailCaptureData';
import { AssetGridDetailScene } from './AssetGridDetailScene';
import * as COMMON from '@dpo-packrat/common';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

enum eAssetGridType {
    eStandard,
    eCaptureData,
    eScene
}

export default async function getAssetDetailsForSystemObject(_: Parent, args: QueryGetAssetDetailsForSystemObjectArgs): Promise<GetAssetDetailsForSystemObjectResult> {
    const { input } = args;
    const { idSystemObject } = input;

    let columns: ColumnDefinition[] = [];
    const assetDetailRows: any[] = [];
    const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchLatestFromSystemObject(idSystemObject);
    if (!assetVersions) {
        RK.logWarning(RK.LogSection.eGQL,'get asset details for SystemObject','retrieved no asset versions',{ idSystemObject },'GraphQL.Schema.SystemObject');
        return { columns, assetDetailRows };
    }

    const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
    if (!SO) {
        RK.logWarning(RK.LogSection.eGQL,'get asset details for SystemObject','unable to retrieve system object',{ idSystemObject },'GraphQL.Schema.SystemObject');
        return { columns, assetDetailRows };
    }

    let eGridType: eAssetGridType = eAssetGridType.eStandard;
    const metadataMetaMap: Map<number, Map<string, string>> = new Map<number, Map<string, string>>(); // map of asset version idSystemObject -> map of metadata name, value pairs
    if (!SO.idCaptureData && !SO.idScene) {
        eGridType = eAssetGridType.eStandard;
        columns = AssetGridDetail.getColumns();
    } else if (SO.idCaptureData) {
        eGridType = eAssetGridType.eCaptureData;
        columns = AssetGridDetailCaptureData.getColumns();
        await extractMetadata(idSystemObject, AssetGridDetailCaptureData.getMetadataColumnNames(), metadataMetaMap);
    } else if (SO.idScene) {
        eGridType = eAssetGridType.eScene;
        columns = AssetGridDetailScene.getColumns();
        await extractMetadata(idSystemObject, AssetGridDetailScene.getMetadataColumnNames(), metadataMetaMap);
        await extractSceneAttachmentMetadata(SO.idScene, metadataMetaMap);
    }

    let assetDetailPreferred: AssetGridDetailBase | null = null;
    for (const assetVersion of assetVersions) {
        // We need the idSystemObject for the asset
        const oID: DBAPI.ObjectIDAndType = { idObject: assetVersion.idAsset, eObjectType: COMMON.eSystemObjectType.eAsset };
        const sID: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
        if (!sID) {
            RK.logError(RK.LogSection.eGQL,'get asset details for SystemObject failed','could not retrieve system object info',{ ...oID },'GraphQL.Schema.SystemObject');
            continue;
        }

        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
        if (!asset) {
            RK.logError(RK.LogSection.eGQL,'get asset details for SystemObject failed','could not retrieve asset for id',{ assetVersion },'GraphQL.Schema.SystemObject');
            continue;
        }

        let assetDetail: AssetGridDetailBase | null = null;
        switch (eGridType) {
            default:
            case eAssetGridType.eStandard: {
                const vocabulary: DBAPI.Vocabulary | undefined = await VocabularyCache.vocabulary(asset.idVAssetType);
                if (!vocabulary) {
                    RK.logError(RK.LogSection.eGQL,'get asset details for SystemObject failed','vocabularyCache could not retrieve vocabulary for asset',{ asset },'GraphQL.Schema.SystemObject');
                    continue;
                }

                assetDetail = new AssetGridDetail(asset, assetVersion, sID.idSystemObject, vocabulary);
            }   break;

            case eAssetGridType.eCaptureData: {
                // Fetch metadata for the system object of the asset version
                const oIDAV: DBAPI.ObjectIDAndType = { idObject: assetVersion.idAssetVersion, eObjectType: COMMON.eSystemObjectType.eAssetVersion };
                const metadataMap: Map<string, string> = await computeMetadataSet(oIDAV, metadataMetaMap);
                assetDetail = new AssetGridDetailCaptureData(asset, assetVersion, sID.idSystemObject, metadataMap);
            }   break;

            case eAssetGridType.eScene: {
                // Fetch metadata for the system object of the asset version
                const oIDAV: DBAPI.ObjectIDAndType = { idObject: assetVersion.idAssetVersion, eObjectType: COMMON.eSystemObjectType.eAssetVersion };
                const metadataMap: Map<string, string> = await computeMetadataSet(oIDAV, metadataMetaMap);
                const vocabulary: DBAPI.Vocabulary | undefined = await VocabularyCache.vocabulary(asset.idVAssetType);
                if (!vocabulary) {
                    RK.logError(RK.LogSection.eGQL,'get asset details for SystemObject failed','vocabularyCache could not retrieve vocabulary for asset',{ asset },'GraphQL.Schema.SystemObject');
                    continue;
                }
                assetDetail = new AssetGridDetailScene(asset, assetVersion, sID.idSystemObject, vocabulary, metadataMap);
            }   break;
        }

        // If we haven't yet identified a preferred assetDetail record, examine this asset's asset type,
        // and compare that to the system object that we've fetched.
        if (!assetDetailPreferred) {
            if (await CACHE.VocabularyCache.isPreferredAsset(asset.idVAssetType, SO)) {
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

async function computeMetadataSet(oIDAV: DBAPI.ObjectIDAndType, metadataMetaMap: Map<number, Map<string, string>>): Promise<Map<string, string>> {
    const sIDAV: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oIDAV);
    let metadataMap: Map<string, string> | undefined = undefined;
    if (sIDAV)
        metadataMap = metadataMetaMap.get(sIDAV.idSystemObject);
    else
        RK.logError(RK.LogSection.eGQL,'compute metadat set failed','could not retrieve system object info',{ ...oIDAV },'GraphQL.Schema.SystemObject');

    if (!metadataMap)
        metadataMap = new Map<string, string>();
    return metadataMap;
}

async function extractMetadata(idSystemObject: number, metadataColumns: string[], metadataMetaMap: Map<number, Map<string, string>>): Promise<boolean> {
    // Query solr for metadata belonging to asset versions that are children of this capture data set or scene
    // Process results, creating a map from idSystemObject of asset version -> { a map of { metadata name -> value } }
    const navigation: NAV.INavigation | null = await NAV.NavigationFactory.getInstance();
    if (!navigation)
        return false;

    const metadataFilter: NAV.MetadataFilter = { idRoot: idSystemObject, forAssetChildren: true, metadataColumns, rows: 300 };
    const metadataResult: NAV.MetadataResult = await navigation.getMetadata(metadataFilter);
    const metadataColLen: number = metadataFilter.metadataColumns.length;
    if (!metadataResult.success) {
        RK.logError(RK.LogSection.eGQL,'extract metadata failed',metadataResult.error, { idSystemObject, metadataColumns },'GraphQL.Schema.SystemObject');
        return false;
    }

    for (const metadataEntry of metadataResult.entries) {
        if (metadataEntry.metadata.length != metadataColLen) {
            RK.logError(RK.LogSection.eGQL,'extract metadata failed',`returned the wrong number of columns (${metadataEntry.metadata.length} instead of ${metadataColLen})`,{ idSystemObject },'GraphQL.Schema.SystemObject');
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
    return true;
}

async function extractSceneAttachmentMetadata(idScene: number, metadataMetaMap: Map<number, Map<string, string>>): Promise<boolean> {
    const MSXs: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromScene(idScene);
    // LOG.info(`getAssetDetailsForSystemObject MSXs ${H.Helpers.JSONStringify(MSXs)}`, LOG.LS.eGQL);
    if (!MSXs) {
        RK.logError(RK.LogSection.eGQL,'extract scene attachment metadata failed',`failed to fetch ModelSceneXref for scene ${idScene}`,{},'GraphQL.Schema.SystemObject');
        return false;
    }

    for (const MSX of MSXs) {
        const SOIModel: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID({ idObject: MSX.idModel, eObjectType: COMMON.eSystemObjectType.eModel });
        if (!SOIModel) {
            RK.logError(RK.LogSection.eGQL,'extract scene attachment metadata failed','failed to fetch system object info for model',{ MSX },'GraphQL.Schema.SystemObject');
            continue;
        }

        const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchLatestFromSystemObject(SOIModel.idSystemObject);
        if (!assetVersions)
            continue;

        for (const assetVersion of assetVersions) {
            const SOIAV: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromAssetVersion(assetVersion);
            if (!SOIAV) {
                RK.logError(RK.LogSection.eGQL,'extract scene attachment metadata failed','failed to fetch system object info for asset version',{ assetVersion },'GraphQL.Schema.SystemObject');
                continue;
            }

            let metadataMap: Map<string, string> | undefined = metadataMetaMap.get(SOIAV.idSystemObject);
            if (!metadataMap) {
                metadataMap = new Map<string, string>();
                metadataMetaMap.set(SOIAV.idSystemObject, metadataMap);
            }

            // if (MSX.Usage)
            //     metadataMap.set('usage', MSX.Usage);
            if (MSX.Quality)
                metadataMap.set('quality', MSX.Quality);
            if (MSX.UVResolution)
                metadataMap.set('uvresolution', MSX.UVResolution.toString());
            if (MSX.BoundingBoxP1X && MSX.BoundingBoxP1Y && MSX.BoundingBoxP1Z && MSX.BoundingBoxP2X && MSX.BoundingBoxP2Y && MSX.BoundingBoxP2Z)
                metadataMap.set('boundingbox', `(${round(MSX.BoundingBoxP1X)}, ${round(MSX.BoundingBoxP1Y)}, ${round(MSX.BoundingBoxP1Z)}) - (${round(MSX.BoundingBoxP2X)}, ${round(MSX.BoundingBoxP2Y)}, ${round(MSX.BoundingBoxP2Z)})`);
            // LOG.info(`getAssetDetailsForSystemObject metadataMap[${SOIAV.idSystemObject}]=${H.Helpers.JSONStringify(metadataMap)}`, LOG.LS.eGQL);
        }
    }
    return true;
}

function round(num: number): string {
    return (Math.ceil(num * 100) / 100).toString();
}
