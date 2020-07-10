/* eslint-disable camelcase */
import * as P from '@prisma/client';
import { DBConnectionFactory } from '..';
import { DBObject } from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class AccessAction extends DBObject<P.AccessAction> {
    constructor(input: P.AccessAction) {
        super(input);
        this.data = input;
    }

    async create(): Promise<boolean> {
        try {
            const { Name, SortOrder } = this.data;
            this.data = await DBConnectionFactory.prisma.accessAction.create({
                data: {
                    Name,
                    SortOrder,
                }
            });
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.AccessAction.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        return true;
    }

    static async fetch(idAccessAction: number): Promise<AccessAction | null> {
        try {
            const pObj: P.AccessAction | null =
                await DBConnectionFactory.prisma.accessAction.findOne({ where: { idAccessAction, }, });
            return pObj ? new AccessAction(pObj) : null;
        } catch (error) {
            LOG.logger.error('DBAPI.AccessAction.fetch', error);
            return null;
        }
    }

    static async fetchFromXref(idAccessRole: number): Promise<P.AccessAction[] | null> {
        try {
            return await DBConnectionFactory.prisma.accessAction.findMany({
                where: {
                    AccessRoleAccessActionXref: {
                        some: { idAccessRole },
                    },
                },
            });
        } catch (error) {
            LOG.logger.error('DBAPI.AccessAction.fetchFromXref', error);
            return null;
        }
    }
}