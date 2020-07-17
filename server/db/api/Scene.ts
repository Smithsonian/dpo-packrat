/* eslint-disable camelcase */
import { Scene as SceneBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { DBConnectionFactory, SystemObject } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class Scene extends DBO.DBObject<SceneBase> implements SceneBase {
    idScene!: number;
    HasBeenQCd!: boolean;
    idAssetThumbnail!: number | null;
    IsOriented!: boolean;
    Name!: string;

    private idAssetThumbnailOrig!: number | null;

    constructor(input: SceneBase) {
        super(input);
        this.updateCachedValues();
    }

    private updateCachedValues(): void {
        this.idAssetThumbnailOrig = this.idAssetThumbnail;
    }

    async create(): Promise<boolean> {
        try {
            const { Name, idAssetThumbnail, IsOriented, HasBeenQCd } = this;
            ({ idScene: this.idScene, Name: this.Name, idAssetThumbnail: this.idAssetThumbnail,
                IsOriented: this.IsOriented, HasBeenQCd: this.HasBeenQCd } =
                await DBConnectionFactory.prisma.scene.create({
                    data: {
                        Name,
                        Asset:              idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                        IsOriented,
                        HasBeenQCd,
                        SystemObject:       { create: { Retired: false }, },
                    },
                }));
            this.updateCachedValues();
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Scene.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idScene, Name, idAssetThumbnail, IsOriented, HasBeenQCd, idAssetThumbnailOrig } = this;
            const retValue: boolean = await DBConnectionFactory.prisma.scene.update({
                where: { idScene, },
                data: {
                    Name,
                    Asset:              idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : idAssetThumbnailOrig ? { disconnect: true, } : undefined,
                    IsOriented,
                    HasBeenQCd,
                },
            }) ? true : /* istanbul ignore next */ false;
            this.updateCachedValues();
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Scene.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idScene } = this;
            return DBO.CopyObject<SystemObjectBase, SystemObject>(
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idScene, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.scene.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idScene: number): Promise<Scene | null> {
        if (!idScene)
            return null;
        try {
            return DBO.CopyObject<SceneBase, Scene>(
                await DBConnectionFactory.prisma.scene.findOne({ where: { idScene, }, }), Scene);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Scene.fetch', error);
            return null;
        }
    }

    static async fetchFromXref(idModel: number): Promise<Scene[] | null> {
        if (!idModel)
            return null;
        try {
            return DBO.CopyArray<SceneBase, Scene>(
                await DBConnectionFactory.prisma.scene.findMany({ where: { ModelSceneXref: { some: { idModel }, }, }, }), Scene);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.fetchSceneFromXref', error);
            return null;
        }
    }
}
