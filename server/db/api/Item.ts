/* eslint-disable camelcase */
import { Item as ItemBase, SystemObject as SystemObjectBase, Prisma } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Item extends DBC.DBObject<ItemBase> implements ItemBase, SystemObjectBased {
    idItem!: number;
    idAssetThumbnail!: number | null;
    idGeoLocation!: number | null;
    Name!: string;
    EntireSubject!: boolean;

    constructor(input: ItemBase) {
        super(input);
    }

    public fetchTableName(): string { return 'Item'; }
    public fetchID(): number { return this.idItem; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idAssetThumbnail, idGeoLocation, Name, EntireSubject } = this;
            ({ idItem: this.idItem, EntireSubject: this.EntireSubject, idAssetThumbnail: this.idAssetThumbnail,
                idGeoLocation: this.idGeoLocation, Name: this.Name } =
                await DBC.DBConnection.prisma.item.create({
                    data: {
                        Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                        GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : undefined,
                        Name,
                        EntireSubject,
                        SystemObject:   { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idItem, idAssetThumbnail, idGeoLocation, Name, EntireSubject } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.item.update({
                where: { idItem, },
                data: {
                    Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : { disconnect: true, },
                    GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : { disconnect: true, },
                    Name,
                    EntireSubject,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.update', LOG.LS.eDB, error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idItem } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idItem, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.item.fetchSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetch(idItem: number): Promise<Item | null> {
        if (!idItem)
            return null;
        try {
            return DBC.CopyObject<ItemBase, Item>(
                await DBC.DBConnection.prisma.item.findUnique({ where: { idItem, }, }), Item);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchAll(): Promise<Item[] | null> {
        try {
            return DBC.CopyArray<ItemBase, Item>(
                await DBC.DBConnection.prisma.item.findMany(), Item);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.fetchAll', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchDerivedFromSubject(idSubject: number): Promise<Item[] | null> {
        if (!idSubject)
            return null;
        try {
            const SOSubject: SystemObject | null = await SystemObject.fetchFromSubjectID(idSubject);
            if (!SOSubject)
                return null;
            return DBC.CopyArray<ItemBase, Item>(
                await DBC.DBConnection.prisma.item.findMany({
                    where: {
                        SystemObject: {
                            AND: [ {
                                idItem: {
                                    not: null,
                                },
                            }, {
                                SystemObjectXref_SystemObjectToSystemObjectXref_idSystemObjectDerived: {
                                    some: {
                                        idSystemObjectMaster: SOSubject.idSystemObject,
                                    },
                                },
                            } ],
                        },
                    },
                }), Item);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.fetchDerivedFromSubject', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of items that are connected to any of the specified subjects.
     * Items are connected to system objects; we examine those system objects which are in a *derived* relationship
     * to system objects connected to any of the specified subjects.
     *
     * Note: this method returns ints instead of boolean for EntireSubject
     * @param idSubjects Array of Subject.idSubject
     */
    static async fetchDerivedFromSubjects(idSubjects: number[]): Promise<Item[] | null> {
        if (!idSubjects || idSubjects.length == 0)
            return null;
        try {
            return DBC.CopyArray<ItemBase, Item>(
                await DBC.DBConnection.prisma.$queryRaw<Item[]>`
                SELECT DISTINCT I.*
                FROM Item AS I
                JOIN SystemObject AS SOI ON (I.idItem = SOI.idItem)
                JOIN SystemObjectXref AS SOX ON (SOI.idSystemObject = SOX.idSystemObjectDerived)
                JOIN SystemObject AS SOS ON (SOX.idSystemObjectMaster = SOS.idSystemObject)
                WHERE SOS.idSubject IN (${Prisma.join(idSubjects)})`, Item);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.fetchDerivedFromSubjects', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of items that are connected to any of the specified capture data
     * Items are connected to system objects; we examine those system objects which are in a *master* relationship
     * to system objects connected to any of the specified capture data.
     *
     * Note: this method returns ints instead of boolean for EntireSubject
     * @param idCaptureDatas Array of CaptureData.idCaptureData
     */
    static async fetchMasterFromCaptureDatas(idCaptureDatas: number[]): Promise<Item[] | null> {
        if (!idCaptureDatas || idCaptureDatas.length == 0)
            return null;
        try {
            return DBC.CopyArray<ItemBase, Item>(
                await DBC.DBConnection.prisma.$queryRaw<Item[]>`
                SELECT DISTINCT I.*
                FROM Item AS I
                JOIN SystemObject AS SOI ON (I.idItem = SOI.idItem)
                JOIN SystemObjectXref AS SOX ON (SOI.idSystemObject = SOX.idSystemObjectMaster)
                JOIN SystemObject AS SOC ON (SOX.idSystemObjectDerived = SOC.idSystemObject)
                WHERE SOC.idCaptureData IN (${Prisma.join(idCaptureDatas)})`, Item);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.fetchMasterFromCaptureData', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of items that are connected to any of the specified models
     * Items are connected to system objects; we examine those system objects which are in a *master* relationship
     * to system objects connected to any of the specified models.
     *
     * Note: this method returns ints instead of boolean for EntireSubject
     * @param idModels Array of Model.idModel
     */
    static async fetchMasterFromModels(idModels: number[]): Promise<Item[] | null> {
        if (!idModels || idModels.length == 0)
            return null;
        try {
            return DBC.CopyArray<ItemBase, Item>(
                await DBC.DBConnection.prisma.$queryRaw<Item[]>`
                SELECT DISTINCT I.*
                FROM Item AS I
                JOIN SystemObject AS SOI ON (I.idItem = SOI.idItem)
                JOIN SystemObjectXref AS SOX ON (SOI.idSystemObject = SOX.idSystemObjectMaster)
                JOIN SystemObject AS SOM ON (SOX.idSystemObjectDerived = SOM.idSystemObject)
                WHERE SOM.idModel IN (${Prisma.join(idModels)})`, Item);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.fetchMasterFromModel', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of items that are connected to any of the specified scenes
     * Items are connected to system objects; we examine those system objects which are in a *master* relationship
     * to system objects connected to any of the specified scenes.
     *
     * Note: this method returns ints instead of boolean for EntireSubject
     * @param idScenes Array of Scene.idScene
     */
    static async fetchMasterFromScenes(idScenes: number[]): Promise<Item[] | null> {
        if (!idScenes || idScenes.length == 0)
            return null;
        try {
            return DBC.CopyArray<ItemBase, Item>(
                await DBC.DBConnection.prisma.$queryRaw<Item[]>`
                SELECT DISTINCT I.*
                FROM Item AS I
                JOIN SystemObject AS SOI ON (I.idItem = SOI.idItem)
                JOIN SystemObjectXref AS SOX ON (SOI.idSystemObject = SOX.idSystemObjectMaster)
                JOIN SystemObject AS SOS ON (SOX.idSystemObjectDerived = SOS.idSystemObject)
                WHERE SOS.idScene IN (${Prisma.join(idScenes)})`, Item);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.fetchMasterFromScene', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of items that are connected to any of the specified IntermediaryFile
     * Items are connected to system objects; we examine those system objects which are in a *master* relationship
     * to system objects connected to any of the specified IntermediaryFiles.
     *
     * Note: this method returns ints instead of boolean for EntireSubject
     * @param idIntermediaryFiles Array of IntermediaryFile.idIntermediaryFile
     */
    static async fetchMasterFromIntermediaryFiles(idIntermediaryFiles: number[]): Promise<Item[] | null> {
        if (!idIntermediaryFiles || idIntermediaryFiles.length == 0)
            return null;
        try {
            return DBC.CopyArray<ItemBase, Item>(
                await DBC.DBConnection.prisma.$queryRaw<Item[]>`
                SELECT DISTINCT I.*
                FROM Item AS I
                JOIN SystemObject AS SOI ON (I.idItem = SOI.idItem)
                JOIN SystemObjectXref AS SOX ON (SOI.idSystemObject = SOX.idSystemObjectMaster)
                JOIN SystemObject AS SOIF ON (SOX.idSystemObjectDerived = SOIF.idSystemObject)
                WHERE SOIF.idIntermediaryFile IN (${Prisma.join(idIntermediaryFiles)})`, Item);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.fetchMasterFromIntermediaryFiles', LOG.LS.eDB, error);
            return null;
        }
    }
}