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
    CountScene!: number | null;
    CountNode!: number | null;
    CountCamera!: number | null;
    CountLight!: number | null;
    CountModel!: number | null;
    CountMeta!: number | null;
    CountSetup!: number | null;
    CountTour!: number | null;
    EdanUUID!: string | null;
    PosedAndQCd!: boolean;
    ApprovedForPublication!: boolean;
    Title!: string | null;

    ApprovedForPublicationOrig!: boolean;

    constructor(input: SceneBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.ApprovedForPublicationOrig = this.ApprovedForPublication;
    }

    public fetchTableName(): string { return 'Scene'; }
    public fetchID(): number { return this.idScene; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, idAssetThumbnail, PosedAndQCd, ApprovedForPublication, CountScene, CountNode, CountCamera,
                CountLight, CountModel, CountMeta, CountSetup, CountTour, EdanUUID, Title } = this;
            ({ idScene: this.idScene, Name: this.Name, idAssetThumbnail: this.idAssetThumbnail,
                PosedAndQCd: this.PosedAndQCd, ApprovedForPublication: this.ApprovedForPublication, CountScene: this.CountScene,
                CountNode: this.CountNode, CountCamera: this.CountCamera, CountLight: this.CountLight,
                CountModel: this.CountModel, CountMeta: this.CountMeta, CountSetup: this.CountSetup,
                CountTour: this.CountTour, EdanUUID: this.EdanUUID, Title: this.Title } =
                await DBC.DBConnection.prisma.scene.create({
                    data: {
                        Name,
                        Asset:              idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                        PosedAndQCd,
                        ApprovedForPublication,
                        SystemObject:       { create: { Retired: false }, },
                        CountScene, CountNode, CountCamera, CountLight, CountModel, CountMeta, CountSetup, CountTour, EdanUUID, Title,
                    },
                }));

            // Audit if someone marks this scene as QC'd
            if (ApprovedForPublication)
                this.audit(eEventKey.ePubSceneQCd); // don't await, allow this to continue asynchronously
            return true;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('create', error);
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idScene, Name, idAssetThumbnail, PosedAndQCd, ApprovedForPublication,
                CountScene, CountNode, CountCamera, CountLight, CountModel, CountMeta, CountSetup, CountTour, EdanUUID,
                Title, ApprovedForPublicationOrig } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.scene.update({
                where: { idScene, },
                data: {
                    Name,
                    Asset:              idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : { disconnect: true, },
                    PosedAndQCd,
                    ApprovedForPublication,
                    CountScene, CountNode, CountCamera, CountLight, CountModel, CountMeta, CountSetup, CountTour, EdanUUID, Title,
                },
            }) ? true : /* istanbul ignore next */ false;

            // Audit if someone marks this scene as QC'd
            if (ApprovedForPublication && !ApprovedForPublicationOrig)
                this.audit(eEventKey.ePubSceneQCd); // don't await, allow this to continue asynchronously
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('update', error);
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

    static async fetchByUUID(EdanUUID: string): Promise<Scene[] | null> {
        if (!EdanUUID)
            return null;
        try {
            return DBC.CopyArray<SceneBase, Scene>(
                await DBC.DBConnection.prisma.scene.findMany({ where: { EdanUUID }, }), Scene);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.fetchByUUID', LOG.LS.eDB, error);
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

    /** fetches scenes which are children of the specified idModelParent */
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

    /** fetches scenes which are parent of the specified idModelParent */
    static async fetchParentScenes(idModelChild: number): Promise<Scene[] | null> {
        if (!idModelChild)
            return null;
        try {
            return DBC.CopyArray<SceneBase, Scene>(
                await DBC.DBConnection.prisma.$queryRaw<Scene[]>`
                SELECT DISTINCT S.*
                FROM Scene AS S
                JOIN SystemObject AS SOM ON (S.idScene = SOM.idScene)
                JOIN SystemObjectXref AS SOX ON (SOM.idSystemObject = SOX.idSystemObjectMaster)
                JOIN SystemObject AS SOD ON (SOX.idSystemObjectDerived = SOD.idSystemObject)
                WHERE SOD.idModel = ${idModelChild}`, Scene);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Model.fetchParentScenes', LOG.LS.eDB, error);
            return null;
        }
    }
}
