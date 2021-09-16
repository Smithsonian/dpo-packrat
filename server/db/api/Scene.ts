/* eslint-disable camelcase */
import { Scene as SceneBase, SystemObject as SystemObjectBase, Prisma } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';
import { eEventKey } from '../../event/interface/EventEnums';

export class Scene extends DBC.DBObject<SceneBase> implements SceneBase, SystemObjectBased {
    idScene!: number;
    Name!: string;
    idAssetThumbnail!: number | null;
    IsOriented!: boolean;
    HasBeenQCd!: boolean;
    CountScene!: number | null;
    CountNode!: number | null;
    CountCamera!: number | null;
    CountLight!: number | null;
    CountModel!: number | null;
    CountMeta!: number | null;
    CountSetup!: number | null;
    CountTour!: number | null;
    EdanUUID!: string | null;

    HasBeenQCdOrig!: boolean;

    constructor(input: SceneBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.HasBeenQCdOrig = this.HasBeenQCd;
    }

    public fetchTableName(): string { return 'Scene'; }
    public fetchID(): number { return this.idScene; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, idAssetThumbnail, IsOriented, HasBeenQCd, CountScene, CountNode, CountCamera,
                CountLight, CountModel, CountMeta, CountSetup, CountTour, EdanUUID } = this;
            ({ idScene: this.idScene, Name: this.Name, idAssetThumbnail: this.idAssetThumbnail,
                IsOriented: this.IsOriented, HasBeenQCd: this.HasBeenQCd, CountScene: this.CountScene,
                CountNode: this.CountNode, CountCamera: this.CountCamera, CountLight: this.CountLight,
                CountModel: this.CountModel, CountMeta: this.CountMeta, CountSetup: this.CountSetup,
                CountTour: this.CountTour, EdanUUID: this.EdanUUID } =
                await DBC.DBConnection.prisma.scene.create({
                    data: {
                        Name,
                        Asset:              idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                        IsOriented,
                        HasBeenQCd,
                        SystemObject:       { create: { Retired: false }, },
                        CountScene, CountNode, CountCamera, CountLight, CountModel, CountMeta, CountSetup, CountTour, EdanUUID
                    },
                }));

            // Audit if someone marks this scene as QC'd
            if (HasBeenQCd)
                this.audit(eEventKey.eSceneQCd); // don't await, allow this to continue asynchronously
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Scene.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idScene, Name, idAssetThumbnail, IsOriented, HasBeenQCd,
                CountScene, CountNode, CountCamera, CountLight, CountModel, CountMeta, CountSetup, CountTour, EdanUUID, HasBeenQCdOrig } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.scene.update({
                where: { idScene, },
                data: {
                    Name,
                    Asset:              idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : { disconnect: true, },
                    IsOriented,
                    HasBeenQCd,
                    CountScene, CountNode, CountCamera, CountLight, CountModel, CountMeta, CountSetup, CountTour, EdanUUID
                },
            }) ? true : /* istanbul ignore next */ false;

            // Audit if someone marks this scene as QC'd
            if (HasBeenQCd && !HasBeenQCdOrig)
                this.audit(eEventKey.eSceneQCd); // don't await, allow this to continue asynchronously
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Scene.update', LOG.LS.eDB, error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idScene } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idScene, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.scene.fetchSystemObject', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.Scene.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchAll(): Promise<Scene[] | null> {
        try {
            return DBC.CopyArray<SceneBase, Scene>(
                await DBC.DBConnection.prisma.scene.findMany(), Scene);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Scene.fetchAll', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.fetchSceneFromXref', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.Scene.fetchDerivedFromItems', LOG.LS.eDB, error);
            return null;
        }
    }

    /** fetches scenes which are chilren of the specified idModelParent */
    static async fetchChildrenScenes(idModelParent: number): Promise<Scene[] | null> {
        if (!idModelParent)
            return null;
        try {
            return DBC.CopyArray<SceneBase, Scene>(
                await DBC.DBConnection.prisma.$queryRaw<Scene[]>`
                SELECT DISTINCT S.*
                FROM Scene AS S
                JOIN SystemObject AS SOD ON (S.idScene = SOD.idScene)
                JOIN SystemObjectXref AS SOX ON (SOD.idSystemObject = SOX.idSystemObjectDerived)
                JOIN SystemObject AS SOM ON (SOX.idSystemObjectMaster = SOM.idSystemObject)
                WHERE SOM.idModel = ${idModelParent}`, Scene);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Model.fetchChildrenScenes', LOG.LS.eDB, error);
            return null;
        }
    }
}
