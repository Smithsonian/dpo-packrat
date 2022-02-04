/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../../../db';
import * as H from '../../../../../utils/helpers';
import { RouteBuilder } from '../../../../../http/routes/routeBuilder';
import { AssetGridDetailBase, ColumnObject, LinkObject } from './AssetGridCommon';
import * as COMMON from '@dpo-packrat/common';

export class AssetGridDetailCaptureData extends AssetGridDetailBase {
    link: LinkObject;
    name: LinkObject;
    variant: string | null;
    version: number;
    size: string;
    dateCreated: Date;
    iso: number | null;
    lens: string | null;
    fNumber: number | null;
    imageHeight: number | null;
    imageWidth: number | null;

    constructor(_asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion, idSystemObject: number, metadataMap: Map<string, string>) {
        super(idSystemObject, assetVersion.idAsset, assetVersion.idAssetVersion);
        this.link = { label: null, path: `${RouteBuilder.DownloadAssetVersion(assetVersion.idAssetVersion)}`, icon: COMMON.eIcon.eIconDownload, origin: COMMON.eLinkOrigin.eServer };
        this.name = { label: assetVersion.FileName, path: `${RouteBuilder.RepositoryDetails(idSystemObject)}`, icon: null, origin: COMMON.eLinkOrigin.eClient };
        this.variant = H.Helpers.safeString(metadataMap.get('variant'));
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
            { colName: 'link', colLabel: 'Link', colDisplay: true, colType: COMMON.eAssetGridColumnType.eHyperLink, colAlign: 'center' },
            { colName: 'name', colLabel: 'Name', colDisplay: true, colType: COMMON.eAssetGridColumnType.eHyperLink, colAlign: 'left' },
            { colName: 'variant', colLabel: 'Variant', colDisplay: true, colType: COMMON.eAssetGridColumnType.eString, colAlign: 'center' },
            { colName: 'size', colLabel: 'Size', colDisplay: true, colType: COMMON.eAssetGridColumnType.eFileSize, colAlign: 'left' },
            { colName: 'imageHeight', colLabel: 'Height', colDisplay: true, colType: COMMON.eAssetGridColumnType.eNumber, colAlign: 'center' },
            { colName: 'imageWidth', colLabel: 'Width', colDisplay: true, colType: COMMON.eAssetGridColumnType.eNumber, colAlign: 'center' },
            { colName: 'iso', colLabel: 'ISO', colDisplay: true, colType: COMMON.eAssetGridColumnType.eNumber, colAlign: 'center' },
            { colName: 'lens', colLabel: 'Lens', colDisplay: true, colType: COMMON.eAssetGridColumnType.eString, colAlign: 'center' },
            { colName: 'fNumber', colLabel: 'FNumber', colDisplay: true, colType: COMMON.eAssetGridColumnType.eNumber, colAlign: 'center' },
            { colName: 'version', colLabel: 'Version', colDisplay: true, colType: COMMON.eAssetGridColumnType.eNumber, colAlign: 'center' },
            { colName: 'dateCreated', colLabel: 'Date Created', colDisplay: true, colType: COMMON.eAssetGridColumnType.eDate, colAlign: 'center' },
        ];
    }

    static getMetadataColumnNames(): string[] {
        return ['variant', 'iso', 'lens', 'fnumber', 'imageheight', 'imagewidth'];
    }
}
