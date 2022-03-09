/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../../../db';
import { RouteBuilder } from '../../../../../http/routes/routeBuilder';
import { AssetGridDetailBase, ColumnObject, LinkObject } from './AssetGridCommon';
import * as COMMON from '@dpo-packrat/common';

export class AssetGridDetail extends AssetGridDetailBase {
    link: LinkObject;
    name: LinkObject;
    filePath: string;
    assetType: string;
    version: number;
    dateCreated: Date;
    hash: string;
    size: string;

    constructor(_asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion, idSystemObject: number, vocabulary: DBAPI.Vocabulary) {
        super(idSystemObject, assetVersion.idAsset, assetVersion.idAssetVersion);
        this.link = { label: null, path: `${RouteBuilder.DownloadAssetVersion(assetVersion.idAssetVersion)}`, icon: COMMON.eIcon.eIconDownload, origin: COMMON.eLinkOrigin.eServer };
        this.name = { label: assetVersion.FileName, path: `${RouteBuilder.RepositoryDetails(idSystemObject)}`, icon: null, origin: COMMON.eLinkOrigin.eClient };
        this.filePath = assetVersion.FilePath;
        this.assetType = vocabulary.Term;
        this.version = assetVersion.Version;
        this.dateCreated = assetVersion.DateCreated;
        this.hash = assetVersion.StorageHash;
        this.size = assetVersion.StorageSize.toString();
    }

    static getColumns(): ColumnObject[] {
        return [
            { colName: 'link', colLabel: 'Link', colDisplay: true, colType: COMMON.eAssetGridColumnType.eHyperLink, colAlign: 'center' },
            { colName: 'name', colLabel: 'Name', colDisplay: true, colType: COMMON.eAssetGridColumnType.eHyperLink, colAlign: 'left' },
            { colName: 'filePath', colLabel: 'Path', colDisplay: true, colType: COMMON.eAssetGridColumnType.eString, colAlign: 'left' },
            { colName: 'assetType', colLabel: 'Asset Type', colDisplay: true, colType: COMMON.eAssetGridColumnType.eString, colAlign: 'center' },
            { colName: 'version', colLabel: 'Version', colDisplay: true, colType: COMMON.eAssetGridColumnType.eNumber, colAlign: 'center' },
            { colName: 'dateCreated', colLabel: 'Date Created', colDisplay: true, colType: COMMON.eAssetGridColumnType.eDate, colAlign: 'center' },
            { colName: 'hash', colLabel: 'Hash', colDisplay: true, colType: COMMON.eAssetGridColumnType.eTruncate, colAlign: 'center' },
            { colName: 'size', colLabel: 'Size', colDisplay: true, colType: COMMON.eAssetGridColumnType.eFileSize, colAlign: 'center' },
        ];
    }
}

