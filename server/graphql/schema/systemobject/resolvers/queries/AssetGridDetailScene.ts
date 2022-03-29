/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../../../db';
// import * as LOG from '../../../../../utils/logger';
import * as H from '../../../../../utils/helpers';
import { RouteBuilder } from '../../../../../http/routes/routeBuilder';
import { AssetGridDetailBase, ColumnObject, LinkObject } from './AssetGridCommon';
import * as COMMON from '@dpo-packrat/common';

export class AssetGridDetailScene extends AssetGridDetailBase {
    link: LinkObject;
    name: LinkObject;
    filePath: string;
    assetType: string;
    version: number;
    dateCreated: Date;
    size: string;
    hash: string;

    // usage: string | null;
    quality: string | null;
    uvResolution: number | null;
    boundingBox: string | null;

    isAttachment: boolean | null;
    type: string | null;
    category: string | null;
    units: string | null;
    modelType: string | null;
    fileType: string | null;
    gltfStandardized: boolean | null;
    dracoCompressed: boolean | null;
    title: string | null;

    constructor(_asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion, idSystemObject: number, vocabulary: DBAPI.Vocabulary, metadataMap: Map<string, string>) {
        super(idSystemObject, assetVersion.idAsset, assetVersion.idAssetVersion);
        this.link = { label: null, path: `${RouteBuilder.DownloadAssetVersion(assetVersion.idAssetVersion)}`, icon: COMMON.eIcon.eIconDownload, origin: COMMON.eLinkOrigin.eServer };
        this.name = { label: assetVersion.FileName, path: `${RouteBuilder.RepositoryDetails(idSystemObject)}`, icon: null, origin: COMMON.eLinkOrigin.eClient };
        this.filePath = assetVersion.FilePath;
        this.assetType = vocabulary.Term;
        this.version = assetVersion.Version;
        this.dateCreated = assetVersion.DateCreated;
        this.hash = assetVersion.StorageHash;
        this.size = assetVersion.StorageSize.toString();
        // this.usage = H.Helpers.safeString(metadataMap.get('usage'));
        this.quality = H.Helpers.safeString(metadataMap.get('quality'));
        this.uvResolution = H.Helpers.safeNumber(metadataMap.get('uvresolution'));
        this.boundingBox = H.Helpers.safeString(metadataMap.get('boundingbox'));

        this.isAttachment = H.Helpers.safeBoolean(metadataMap.get('isattachment'));
        this.type = H.Helpers.safeString(metadataMap.get('type'));
        this.category = H.Helpers.safeString(metadataMap.get('category'));
        this.units = H.Helpers.safeString(metadataMap.get('units'));
        this.modelType = H.Helpers.safeString(metadataMap.get('modeltype'));
        this.fileType = H.Helpers.safeString(metadataMap.get('filetype'));
        this.gltfStandardized = H.Helpers.safeBoolean(metadataMap.get('gltfstandardized'));
        this.dracoCompressed = H.Helpers.safeBoolean(metadataMap.get('dracocompressed'));
        this.title = H.Helpers.safeString(metadataMap.get('title'));
        // LOG.info(`AssetGridDetailScene(${idSystemObject}): ${JSON.stringify(metadataMap, H.Helpers.saferStringify)}, ${JSON.stringify(this)}`, LOG.LS.eGQL);
    }

    static getColumns(): ColumnObject[] {
        return [
            { colName: 'link', colLabel: 'Link', colDisplay: true, colType: COMMON.eAssetGridColumnType.eHyperLink, colAlign: 'center' },
            { colName: 'name', colLabel: 'Name', colDisplay: true, colType: COMMON.eAssetGridColumnType.eHyperLink, colAlign: 'left' },
            { colName: 'filePath', colLabel: 'Path', colDisplay: true, colType: COMMON.eAssetGridColumnType.eString, colAlign: 'left' },
            { colName: 'assetType', colLabel: 'Asset Type', colDisplay: true, colType: COMMON.eAssetGridColumnType.eString, colAlign: 'center' },
            { colName: 'version', colLabel: 'Version', colDisplay: true, colType: COMMON.eAssetGridColumnType.eNumber, colAlign: 'center' },
            { colName: 'dateCreated', colLabel: 'Date Created', colDisplay: true, colType: COMMON.eAssetGridColumnType.eDate, colAlign: 'center' },
            { colName: 'hash', colLabel: 'Hash', colDisplay: true, colType: COMMON.eAssetGridColumnType.eTruncate, colAlign: 'right' },
            { colName: 'size', colLabel: 'Size', colDisplay: true, colType: COMMON.eAssetGridColumnType.eFileSize, colAlign: 'right' },
            // { colName: 'usage', colLabel: 'Usage', colDisplay: true, colType: COMMON.eAssetGridColumnType.eString, colAlign: 'left' },
            { colName: 'quality', colLabel: 'Quality', colDisplay: true, colType: COMMON.eAssetGridColumnType.eString, colAlign: 'center' },
            { colName: 'uvResolution', colLabel: 'UV', colDisplay: true, colType: COMMON.eAssetGridColumnType.eNumber, colAlign: 'center' },
            { colName: 'boundingBox', colLabel: 'Bounding Box', colDisplay: true, colType: COMMON.eAssetGridColumnType.eString, colAlign: 'center' },

            { colName: 'isAttachment', colLabel: 'Att?', colDisplay: true, colType: COMMON.eAssetGridColumnType.eBoolean, colAlign: 'center' },
            { colName: 'type', colLabel: 'Type', colDisplay: true, colType: COMMON.eAssetGridColumnType.eString, colAlign: 'left' },
            { colName: 'category', colLabel: 'Cat', colDisplay: true, colType: COMMON.eAssetGridColumnType.eString, colAlign: 'left' },
            { colName: 'units', colLabel: 'Units', colDisplay: true, colType: COMMON.eAssetGridColumnType.eString, colAlign: 'left' },
            { colName: 'modelType', colLabel: 'Model', colDisplay: true, colType: COMMON.eAssetGridColumnType.eString, colAlign: 'left' },
            { colName: 'fileType', colLabel: 'File', colDisplay: true, colType: COMMON.eAssetGridColumnType.eString, colAlign: 'left' },
            { colName: 'gltfStandardized', colLabel: 'glTF Std', colDisplay: true, colType: COMMON.eAssetGridColumnType.eBoolean, colAlign: 'center' },
            { colName: 'dracoCompressed', colLabel: 'Draco Compr', colDisplay: true, colType: COMMON.eAssetGridColumnType.eBoolean, colAlign: 'center' },
            { colName: 'title', colLabel: 'Title', colDisplay: true, colType: COMMON.eAssetGridColumnType.eString, colAlign: 'left' },
        ];
    }

    static getMetadataColumnNames(): string[] {
        return [/* 'usage', */ 'quality', 'uvresolution', 'boundingbox', 'isattachment', 'type', 'category', 'units', 'modeltype', 'filetype', 'gltfstandardized', 'dracocompressed', 'title'];
    }
}

