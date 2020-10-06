/* eslint-disable camelcase */
import { Item as ItemBase, SystemObject as SystemObjectBase, join } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Item extends DBC.DBObject<ItemBase> implements ItemBase, SystemObjectBased {
    idItem!: number;
    EntireSubject!: boolean;
    idAssetThumbnail!: number | null;
    idGeoLocation!: number | null;
    Name!: string;

    private idAssetThumbnailOrig!: number | null;
    private idGeoLocationOrig!: number | null;

    constructor(input: ItemBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idAssetThumbnailOrig = this.idAssetThumbnail;
        this.idGeoLocationOrig = this.idGeoLocation;
    }

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
            LOG.logger.error('DBAPI.Item.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idItem, idAssetThumbnail, idGeoLocation, Name, EntireSubject, idAssetThumbnailOrig, idGeoLocationOrig } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.item.update({
                where: { idItem, },
                data: {
                    Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : idAssetThumbnailOrig ? { disconnect: true, } : undefined,
                    GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : idGeoLocationOrig ? { disconnect: true, } : undefined,
                    Name,
                    EntireSubject,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Item.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idItem } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findOne({ where: { idItem, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.item.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idItem: number): Promise<Item | null> {
        if (!idItem)
            return null;
        try {
            return DBC.CopyObject<ItemBase, Item>(
                await DBC.DBConnection.prisma.item.findOne({ where: { idItem, }, }), Item);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Item.fetch', error);
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
            LOG.logger.error('DBAPI.Item.fetchDerivedFromSubject', error);
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
                WHERE SOS.idSubject IN (${join(idSubjects)})`, Item);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Item.fetchDerivedFromSubjects', error);
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
                WHERE SOC.idCaptureData IN (${join(idCaptureDatas)})`, Item);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Item.fetchMasterFromCaptureData', error);
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
                WHERE SOM.idModel IN (${join(idModels)})`, Item);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Item.fetchMasterFromModel', error);
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
                WHERE SOS.idScene IN (${join(idScenes)})`, Item);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Item.fetchMasterFromScene', error);
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
                WHERE SOIF.idIntermediaryFile IN (${join(idIntermediaryFiles)})`, Item);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Item.fetchMasterFromIntermediaryFiles', error);
            return null;
        }
    }
}