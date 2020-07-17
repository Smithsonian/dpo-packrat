/* eslint-disable camelcase */
import { Item as ItemBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { DBConnectionFactory, SystemObject } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class Item extends DBO.DBObject<ItemBase> implements ItemBase {
    idItem!: number;
    EntireSubject!: boolean;
    idAssetThumbnail!: number | null;
    idGeoLocation!: number | null;
    idSubject!: number;
    Name!: string;

    constructor(input: ItemBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idSubject, idAssetThumbnail, idGeoLocation, Name, EntireSubject } = this;
            ({ idItem: this.idItem, EntireSubject: this.EntireSubject, idAssetThumbnail: this.idAssetThumbnail,
                idGeoLocation: this.idGeoLocation, idSubject: this.idSubject, Name: this.Name } =
                await DBConnectionFactory.prisma.item.create({
                    data: {
                        Subject:        { connect: { idSubject }, },
                        Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                        GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : undefined,
                        Name,
                        EntireSubject,
                        SystemObject:   { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.Item.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idItem, idSubject, idAssetThumbnail, idGeoLocation, Name, EntireSubject } = this;
            return await DBConnectionFactory.prisma.item.update({
                where: { idItem, },
                data: {
                    Subject:        { connect: { idSubject }, },
                    Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                    GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : undefined,
                    Name,
                    EntireSubject,
                },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.Item.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idItem } = this;
            return DBO.CopyObject<SystemObjectBase, SystemObject>(
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idItem, }, }), SystemObject);
        } catch (error) {
            LOG.logger.error('DBAPI.item.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idItem: number): Promise<Item | null> {
        try {
            return DBO.CopyObject<ItemBase, Item>(
                await DBConnectionFactory.prisma.item.findOne({ where: { idItem, }, }), Item);
        } catch (error) {
            LOG.logger.error('DBAPI.Item.fetch', error);
            return null;
        }
    }

    static async fetchFromSubject(idSubject: number): Promise<Item[] | null> {
        try {
            return DBO.CopyArray<ItemBase, Item>(
                await DBConnectionFactory.prisma.item.findMany({ where: { idSubject } }), Item);
        } catch (error) {
            LOG.logger.error('DBAPI.Item.fetchFromSubject', error);
            return null;
        }
    }
}