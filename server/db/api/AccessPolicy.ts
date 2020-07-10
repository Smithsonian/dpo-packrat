/* eslint-disable camelcase */
import * as P from '@prisma/client';
import { DBConnectionFactory } from '..';
import { DBObject } from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class AccessPolicy extends DBObject<P.AccessPolicy> {
    constructor(input: P.AccessPolicy) {
        super(input);
        this.data = input;
    }

    async create(): Promise<boolean> {
        try {
            const { idUser, idAccessRole, idAccessContext } = this.data;
            this.data = await DBConnectionFactory.prisma.accessPolicy.create({
                data: {
                    User:           { connect: { idUser }, },
                    AccessRole:     { connect: { idAccessRole }, },
                    AccessContext:  { connect: { idAccessContext }, },
                }
            });
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.AccessPolicy.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        return true;
    }

    static async fetch(idAccessPolicy: number): Promise<AccessPolicy | null> {
        try {
            const pObj: P.AccessPolicy | null =
                await DBConnectionFactory.prisma.accessPolicy.findOne({ where: { idAccessPolicy, }, });
            return pObj ? new AccessPolicy(pObj) : null;
        } catch (error) {
            LOG.logger.error('DBAPI.AccessPolicy.fetch', error);
            return null;
        }
    }

    static async fetchFromAccessContext(idAccessContext: number): Promise<P.AccessPolicy[] | null> {
        try {
            return await DBConnectionFactory.prisma.accessPolicy.findMany({ where: { idAccessContext } });
        } catch (error) {
            LOG.logger.error('DBAPI.AccessPolicy.fetchFromAccessContext', error);
            return null;
        }
    }

    static async fetchFromUser(idUser: number): Promise<P.AccessPolicy[] | null> {
        try {
            return await DBConnectionFactory.prisma.accessPolicy.findMany({ where: { idUser } });
        } catch (error) {
            LOG.logger.error('DBAPI.AccessPolicy.fetchFromUser', error);
            return null;
        }
    }
}