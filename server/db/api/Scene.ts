/* eslint-disable camelcase */
import { Scene as SceneBase, SystemObject as SystemObjectBase, Prisma } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Scene extends DBC.DBObject<SceneBase> implements SceneBase, SystemObjectBased {
    idScene!: number;
    HasBeenQCd!: boolean;
    idAssetThumbnail!: number | null;
    IsOriented!: boolean;
    Name!: string;

    private idAssetThumbnailOrig!: number | null;

    constructor(input: SceneBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idAssetThumbnailOrig = this.idAssetThumbnail;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, idAssetThumbnail, IsOriented, HasBeenQCd } = this;
            ({ idScene: this.idScene, Name: this.Name, idAssetThumbnail: this.idAssetThumbnail,
                IsOriented: this.IsOriented, HasBeenQCd: this.HasBeenQCd } =
                await DBC.DBConnection.prisma.scene.create({
                    data: {
                        Name,
                        Asset:              idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                        IsOriented,
                        HasBeenQCd,
                        SystemObject:       { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Scene.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idScene, Name, idAssetThumbnail, IsOriented, HasBeenQCd, idAssetThumbnailOrig } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.scene.update({
                where: { idScene, },
                data: {
                    Name,
                    Asset:              idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : idAssetThumbnailOrig ? { disconnect: true, } : undefined,
                    IsOriented,
                    HasBeenQCd,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Scene.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idScene } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idScene, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.scene.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idScene: number): Promise<Scene | null> {
        if (!idScene)
            return null;
        try {
            return DBC.CopyObject<SceneBase, Scene>(
                await DBC.DBConnection.prisma.scene.findUnique({ where: { idScene, }, }), Scene);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Scene.fetch', error);
            return null;
        }
    }

    static async fetchAll(): Promise<Scene[] | null> {
        try {
            return DBC.CopyArray<SceneBase, Scene>(
                await DBC.DBConnection.prisma.scene.findMany(), Scene);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Scene.fetchAll', error);
            return null;
        }
    }

    static async fetchFromXref(idModel: number): Promise<Scene[] | null> {
        if (!idModel)
            return null;
        try {
            return DBC.CopyArray<SceneBase, Scene>(
                await DBC.DBConnection.prisma.scene.findMany({ where: { ModelSceneXref: { some: { idModel }, }, }, }), Scene);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.fetchSceneFromXref', error);
            return null;
        }
    }

    /**
     * Computes the array of Scenes that are connected to any of the specified items.
     * Scenes are connected to system objects; we examine those system objects which are in a *derived* relationship
     * to system objects connected to any of the specified items.
     * @param idItem Array of Item.idItem
     */
    static async fetchDerivedFromItems(idItem: number[]): Promise<Scene[] | null> {
        if (!idItem || idItem.length == 0)
            return null;
        try {
            return DBC.CopyArray<SceneBase, Scene>(
                await DBC.DBConnection.prisma.$queryRaw<Scene[]>`
                SELECT DISTINCT S.*
                FROM Scene AS S
                JOIN SystemObject AS SOS ON (S.idScene = SOS.idScene)
                JOIN SystemObjectXref AS SOX ON (SOS.idSystemObject = SOX.idSystemObjectDerived)
                JOIN SystemObject AS SOI ON (SOX.idSystemObjectMaster = SOI.idSystemObject)
                WHERE SOI.idItem IN (${Prisma.join(idItem)})`, Scene);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Scene.fetchDerivedFromItems', error);
            return null;
        }
    }
}
