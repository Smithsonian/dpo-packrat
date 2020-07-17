/* eslint-disable camelcase */
import { AccessContextObject as AccessContextObjectBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class AccessContextObject extends DBO.DBObject<AccessContextObjectBase> implements AccessContextObjectBase {
    idAccessContext!: number;
    idAccessContextObject!: number;
    idSystemObject!: number;

    constructor(input: AccessContextObjectBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idAccessContext, idSystemObject } = this;
            ({ idAccessContextObject: this.idAccessContextObject, idAccessContext: this.idAccessContext,
                idSystemObject: this.idSystemObject } =
                await DBConnectionFactory.prisma.accessContextObject.create({
                    data: {
                        AccessContext: { connect: { idAccessContext }, },
                        SystemObject:  { connect: { idSystemObject }, },
                    }
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.AccessContextObject.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idAccessContextObject, idAccessContext, idSystemObject } = this;
            return await DBConnectionFactory.prisma.accessContextObject.update({
                where: { idAccessContextObject, },
                data: {
                    AccessContext: { connect: { idAccessContext }, },
                    SystemObject:  { connect: { idSystemObject }, },
                }
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.AccessContextObject.update', error);
            return false;
        }
    }

    static async fetch(idAccessContextObject: number): Promise<AccessContextObject | null> {
        if (!idAccessContextObject)
            return null;
        try {
            return DBO.CopyObject<AccessContextObjectBase, AccessContextObject>(
                await DBConnectionFactory.prisma.accessContextObject.findOne({ where: { idAccessContextObject, }, }), AccessContextObject);
        } catch (error) {
            LOG.logger.error('DBAPI.AccessContextObject.fetch', error);
            return null;
        }
    }

    static async fetchFromAccessContext(idAccessContext: number): Promise<AccessContextObject[] | null> {
        if (!idAccessContext)
            return null;
        try {
            return DBO.CopyArray<AccessContextObjectBase, AccessContextObject>(
                await DBConnectionFactory.prisma.accessContextObject.findMany({ where: { idAccessContext } }), AccessContextObject);
        } catch (error) {
            LOG.logger.error('DBAPI.AccessContextObject.fetchFromAccessContext', error);
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<AccessContextObject[] | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBO.CopyArray<AccessContextObjectBase, AccessContextObject>(
                await DBConnectionFactory.prisma.accessContextObject.findMany({ where: { idSystemObject } }), AccessContextObject);
        } catch (error) {
            LOG.logger.error('DBAPI.AccessContextObject.fetchFromSystemObject', error);
            return null;
        }
    }
}
