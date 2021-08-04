/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../../../db';
import * as H from '../../../../../utils/helpers';
import { RouteBuilder } from '../../../../../http/routes/routeBuilder';
import { AssetGridDetailBase, ColumnObject, LinkObject, eAssetGridColumnType, eIcon, eLinkOrigin } from './AssetGridCommon';

export class AssetGridDetailCaptureData extends AssetGridDetailBase {
    link: LinkObject;
    name: LinkObject;
    filePath: string;
    version: number;
    size: string;
    dateCreated: Date;
    iso: number | null;
    lens: string | null;
    fNumber: number | null;
    imageHeight: number | null;
    imageWidth: number | null;

    constructor(asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion, idSystemObject: number, metadataMap: Map<string, string>) {
        super(idSystemObject, assetVersion.idAsset, assetVersion.idAssetVersion);
        this.link = { label: null, path: `${RouteBuilder.DownloadAssetVersion(assetVersion.idAssetVersion)}`, icon: eIcon.eIconDownload, origin: eLinkOrigin.eServer };
        this.name = { label: assetVersion.FileName, path: `${RouteBuilder.RepositoryDetails(idSystemObject)}`, icon: null, origin: eLinkOrigin.eClient };
        this.filePath = asset.FilePath;
        this.version = assetVersion.Version;
        this.size = assetVersion.StorageSize.toString();
        this.dateCreated = assetVersion.DateCreated;

        this.iso = H.Helpers.safeNumber(metadataMap.get('iso'));
        this.lens = H.Helpers.safeString(metadataMap.get('lens'));
        this.fNumber = H.Helpers.safeNumber(metadataMap.get('fnumber'));
        this.imageHeight = H.Helpers.safeNumber(metadataMap.get('imageheight'));
        this.imageWidth = H.Helpers.safeNumber(metadataMap.get('imagewidth'));
    }

    static getColumns(): ColumnObject[] {
        return [
            { colName: 'link', colLabel: 'Link', colDisplay: true, colType: eAssetGridColumnType.eHyperLink, colAlign: 'center' },
            { colName: 'name', colLabel: 'Name', colDisplay: true, colType: eAssetGridColumnType.eHyperLink, colAlign: 'left' },
            { colName: 'filePath', colLabel: 'Path', colDisplay: true, colType: eAssetGridColumnType.eString, colAlign: 'left' },
            { colName: 'version', colLabel: 'Version', colDisplay: true, colType: eAssetGridColumnType.eNumber, colAlign: 'center' },
            { colName: 'size', colLabel: 'Size', colDisplay: true, colType: eAssetGridColumnType.eFileSize, colAlign: 'left' },
            { colName: 'dateCreated', colLabel: 'Date Created', colDisplay: true, colType: eAssetGridColumnType.eDate, colAlign: 'left' },
            { colName: 'iso', colLabel: 'ISO', colDisplay: true, colType: eAssetGridColumnType.eNumber, colAlign: 'left' },
            { colName: 'lens', colLabel: 'Lens', colDisplay: true, colType: eAssetGridColumnType.eString, colAlign: 'left' },
            { colName: 'fNumber', colLabel: 'FNumber', colDisplay: true, colType: eAssetGridColumnType.eNumber, colAlign: 'left' },
            { colName: 'imageHeight', colLabel: 'Image Height', colDisplay: true, colType: eAssetGridColumnType.eNumber, colAlign: 'left' },
            { colName: 'imageWidth', colLabel: 'Image Width', colDisplay: true, colType: eAssetGridColumnType.eNumber, colAlign: 'left' }
        ];
    }
}
