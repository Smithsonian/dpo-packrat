/* eslint-disable camelcase */
import { Scene as SceneBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Scene extends DBC.DBObject<SceneBase> implements SceneBase {
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
                await DBC.DBConnectionFactory.prisma.scene.create({
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
            const retValue: boolean = await DBC.DBConnectionFactory.prisma.scene.update({
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
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idScene, }, }), SystemObject);
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
                await DBC.DBConnectionFactory.prisma.scene.findOne({ where: { idScene, }, }), Scene);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Scene.fetch', error);
            return null;
        }
    }

    static async fetchFromXref(idModel: number): Promise<Scene[] | null> {
        if (!idModel)
            return null;
        try {
            return DBC.CopyArray<SceneBase, Scene>(
                await DBC.DBConnectionFactory.prisma.scene.findMany({ where: { ModelSceneXref: { some: { idModel }, }, }, }), Scene);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.fetchSceneFromXref', error);
            return null;
        }
    }
}
