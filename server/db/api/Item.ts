/* eslint-disable camelcase */
import { Item as ItemBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Item extends DBC.DBObject<ItemBase> implements ItemBase {
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

    static async fetchFromSubject(idSubject: number): Promise<Item[] | null> {
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
            LOG.logger.error('DBAPI.Item.fetchFromSubject', error);
            return null;
        }
    }
}