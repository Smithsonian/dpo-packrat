/* eslint-disable camelcase */
import * as P from '@prisma/client';
import { DBConnectionFactory } from '..';
import { DBObject } from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class AccessContext extends DBObject<P.AccessContext> {
    constructor(input: P.AccessContext) {
        super(input);
        this.data = input;
    }

    async create(): Promise<boolean> {
        try {
            const { Authoritative, CaptureData, Global, IntermediaryFile, Model, Scene } = this.data;
            this.data = await DBConnectionFactory.prisma.accessContext.create({
                data: { Authoritative, CaptureData, Global, IntermediaryFile, Model, Scene, }
            });
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.AccessContext.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        return true;
    }

    static async fetch(idAccessContext: number): Promise<AccessContext | null> {
        try {
            const pObj: P.AccessContext | null =
                await DBConnectionFactory.prisma.accessContext.findOne({ where: { idAccessContext, }, });
            return pObj ? new AccessContext(pObj) : null;
        } catch (error) {
            LOG.logger.error('DBAPI.AccessContext.fetch', error);
            return null;
        }
    }
}
