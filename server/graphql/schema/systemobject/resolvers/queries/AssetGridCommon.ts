export enum eIcon {
    eIconDownload = 1
}

export enum eLinkOrigin {
    eClient = 1,
    eServer = 2,
    eNone = 0
}

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
    origin: eLinkOrigin;
};

export class AssetGridDetailBase {
    idSystemObject: number;
    idAsset: number;
    idAssetVersion: number;

    constructor(idSystemObject: number, idAsset: number, idAssetVersion: number) {
        this.idSystemObject = idSystemObject;
        this.idAsset = idAsset;
        this.idAssetVersion = idAssetVersion;
    }
}