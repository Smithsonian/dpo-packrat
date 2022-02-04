import * as COMMON from '@dpo-packrat/common';

export type ColumnObject = {
    colName: string;
    colLabel: string;
    colDisplay: boolean;
    colType: COMMON.eAssetGridColumnType;
    colAlign: string;
};

export type LinkObject = {
    label: string | null;
    path: string | null;
    icon: number | null;
    origin: COMMON.eLinkOrigin;
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