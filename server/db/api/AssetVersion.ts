/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { AssetVersion as AssetVersionBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { DBConnectionFactory, SystemObject } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class AssetVersion extends DBO.DBObject<AssetVersionBase> implements AssetVersionBase {
    idAssetVersion!: number;
    DateCreated!: Date;
    idAsset!: number;
    idUserCreator!: number;
    StorageChecksum!: string;
    StorageLocation!: string;
    StorageSize!: number;

    constructor(input: AssetVersionBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { DateCreated, idAsset, idUserCreator, StorageChecksum, StorageLocation, StorageSize } = this;
            ({ idAssetVersion: this.idAssetVersion, DateCreated: this.DateCreated, idAsset: this.idAsset,
                idUserCreator: this.idUserCreator, StorageChecksum: this.StorageChecksum,
                StorageLocation: this.StorageLocation, StorageSize: this.StorageSize } =
                await DBConnectionFactory.prisma.assetVersion.create({
                    data: {
                        Asset:              { connect: { idAsset }, },
                        User:               { connect: { idUser: idUserCreator }, },
                        DateCreated,
                        StorageLocation,
                        StorageChecksum,
                        StorageSize,
                        SystemObject:       { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AssetVersion.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idAssetVersion, DateCreated, idAsset, idUserCreator, StorageChecksum, StorageLocation, StorageSize } = this;
            return await DBConnectionFactory.prisma.assetVersion.update({
                where: { idAssetVersion, },
                data: {
                    Asset:              { connect: { idAsset }, },
                    User:               { connect: { idUser: idUserCreator }, },
                    DateCreated,
                    StorageLocation,
                    StorageChecksum,
                    StorageSize,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AssetVersion.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idAssetVersion } = this;
            return DBO.CopyObject<SystemObjectBase, SystemObject>(
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idAssetVersion, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AssetVersion.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idAssetVersion: number): Promise<AssetVersion | null> {
        if (!idAssetVersion)
            return null;
        try {
            return DBO.CopyObject<AssetVersionBase, AssetVersion>(
                await DBConnectionFactory.prisma.assetVersion.findOne({ where: { idAssetVersion, }, }), AssetVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AssetVersion.fetch', error);
            return null;
        }
    }

    static async fetchFromAsset(idAsset: number): Promise<AssetVersion[] | null> {
        if (!idAsset)
            return null;
        try {
            return DBO.CopyArray<AssetVersionBase, AssetVersion>(
                await DBConnectionFactory.prisma.assetVersion.findMany({ where: { idAsset } }), AssetVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AssetVersion.fetchFromAsset', error);
            return null;
        }
    }

    static async fetchFromUser(idUserCreator: number): Promise<AssetVersion[] | null> {
        if (!idUserCreator)
            return null;
        try {
            return DBO.CopyArray<AssetVersionBase, AssetVersion>(
                await DBConnectionFactory.prisma.assetVersion.findMany({ where: { idUserCreator } }), AssetVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Asset.fetchFromUser', error);
            return null;
        }
    }
}
