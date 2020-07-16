/* eslint-disable camelcase */
import { SystemObjectVersion as SystemObjectVersionBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class SystemObjectVersion extends DBO.DBObject<SystemObjectVersionBase> implements SystemObjectVersionBase {
    idSystemObjectVersion!: number;
    idSystemObject!: number;
    PublishedState!: number;

    constructor(input: SystemObjectVersionBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idSystemObject, PublishedState } = this;
            ({ idSystemObjectVersion: this.idSystemObjectVersion, idSystemObject: this.idSystemObject,
                PublishedState: this.PublishedState } =
                await DBConnectionFactory.prisma.systemObjectVersion.create({
                    data: {
                        SystemObject: { connect: { idSystemObject }, },
                        PublishedState,
                    },
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.SystemObjectVersion.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idSystemObjectVersion, idSystemObject, PublishedState } = this;
            return await DBConnectionFactory.prisma.systemObjectVersion.update({
                where: { idSystemObjectVersion, },
                data: {
                    SystemObject: { connect: { idSystemObject }, },
                    PublishedState,
                },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.SystemObjectVersion.update', error);
            return false;
        }
    }

    static async fetch(idSystemObjectVersion: number): Promise<SystemObjectVersion | null> {
        try {
            return DBO.CopyObject<SystemObjectVersionBase, SystemObjectVersion>(
                await DBConnectionFactory.prisma.systemObjectVersion.findOne({ where: { idSystemObjectVersion, }, }), SystemObjectVersion);
        } catch (error) {
            LOG.logger.error('DBAPI.SystemObjectVersion.fetch', error);
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<SystemObjectVersion[] | null> {
        try {
            return DBO.CopyArray<SystemObjectVersionBase, SystemObjectVersion>(
                await DBConnectionFactory.prisma.systemObjectVersion.findMany({ where: { idSystemObject } }), SystemObjectVersion);
        } catch (error) {
            LOG.logger.error('DBAPI.SystemObjectVersion.fetchFromSystemObject', error);
            return null;
        }
    }
}
