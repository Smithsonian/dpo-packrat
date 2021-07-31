/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
export enum eAssetGridColumnType {
    eString = 0,
    eNumber = 1,
    eBoolean = 2,
    eHyperLink = 3,
    eDate = 4,
    eFileSize = 5
}

export type ColumnObject = {
    colName: string;
    colLabel: string;
    colDisplay: boolean;
    colType: eAssetGridColumnType;
    colAlign: string;
};

export type LinkObject = {
    label: string | null;
    path: string | null;
    icon: number | null;
    origin: number;
};

export class AssetGridDetail {
    idSystemObject!: number;
    idAsset!: number;
    idAssetVersion!: number;
    name!: LinkObject;
    link!: LinkObject;
    filePath!: string;
    assetType!: number;
    version!: number;
    dateCreated!: Date;
    size!: string;

    constructor(input: any) {
        this.idSystemObject = input.idSystemObject;
        this.idAsset = input.idAsset;
        this.idAssetVersion = input.idAssetVersion;
        this.name = input.name;
        this.link = input.link;
        this.filePath = input.filePath;
        this.assetType = input.assetType;
        this.version = input.version;
        this.dateCreated = input.dateCreated;
        this.size = input.size;
    }

    static getColumns(): ColumnObject[] {
        return [
            { colName: 'link', colLabel: 'Link', colDisplay: true, colType: eAssetGridColumnType.eHyperLink, colAlign: 'center' },
            { colName: 'name', colLabel: 'Name', colDisplay: true, colType: eAssetGridColumnType.eHyperLink, colAlign: 'left' },
            { colName: 'filePath', colLabel: 'Path', colDisplay: true, colType: eAssetGridColumnType.eString, colAlign: 'left' },
            { colName: 'assetType', colLabel: 'Asset Type', colDisplay: true, colType: eAssetGridColumnType.eString, colAlign: 'center' },
            { colName: 'version', colLabel: 'Version', colDisplay: true, colType: eAssetGridColumnType.eNumber, colAlign: 'center' },
            { colName: 'dateCreated', colLabel: 'Date Created', colDisplay: true, colType: eAssetGridColumnType.eDate, colAlign: 'center' },
            { colName: 'size', colLabel: 'Size', colDisplay: true, colType: eAssetGridColumnType.eFileSize, colAlign: 'center' }
        ];
    }
}

export class AssetGridDetailCaptureData {
    idSystemObject!: number;
    idAsset!: number;
    idAssetVersion!: number;
    name!: LinkObject;
    link!: LinkObject;
    filePath!: string;
    version!: number;
    size!: string;
    dateCreated!: Date;
    iso!: number;
    lens!: string;
    fNumber!: number;
    imageHeight!: number;
    imageWidth!: number;

    constructor(input: any) {
        this.idSystemObject = input.idSystemObject;
        this.idAsset = input.idAsset;
        this.idAssetVersion = input.idAssetVersion;
        this.name = input.name;
        this.link = input.link;
        this.filePath = input.filePath;
        this.version = input.version;
        this.size = input.string;
        this.dateCreated = input.dateCreated;
        this.iso = input.iso;
        this.lens = input.lens;
        this.fNumber = input.fNumber;
        this.imageHeight = input.imageHeight;
        this.imageWidth = input.imageWidth;
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
