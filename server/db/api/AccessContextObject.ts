/* eslint-disable camelcase */
import * as P from '@prisma/client';
import { DBConnectionFactory } from '..';
import { DBObject } from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class AccessContextObject extends DBObject<P.AccessContextObject> {
    constructor(input: P.AccessContextObject) {
        super(input);
        this.data = input;
    }

    async create(): Promise<boolean> {
        try {
            const { idAccessContext, idSystemObject } = this.data;
            this.data = await DBConnectionFactory.prisma.accessContextObject.create({
                data: {
                    AccessContext: { connect: { idAccessContext }, },
                    SystemObject:  { connect: { idSystemObject }, },
                }
            });
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.AccessContextObject.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        return true;
    }

    static async fetch(idAccessContextObject: number): Promise<AccessContextObject | null> {
        try {
            const pObj: P.AccessContextObject | null =
                await DBConnectionFactory.prisma.accessContextObject.findOne({ where: { idAccessContextObject, }, });
            return pObj ? new AccessContextObject(pObj) : null;
        } catch (error) {
            LOG.logger.error('DBAPI.AccessContextObject.fetch', error);
            return null;
        }
    }

    static async fetchFromAccessContext(idAccessContext: number): Promise<P.AccessContextObject[] | null> {
        try {
            return await DBConnectionFactory.prisma.accessContextObject.findMany({ where: { idAccessContext } });
        } catch (error) {
            LOG.logger.error('DBAPI.AccessContextObject.fetchFromAccessContext', error);
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<P.AccessContextObject[] | null> {
        try {
            return await DBConnectionFactory.prisma.accessContextObject.findMany({ where: { idSystemObject } });
        } catch (error) {
            LOG.logger.error('DBAPI.AccessContextObject.fetchFromAccessContext', error);
            return null;
        }
    }
}
