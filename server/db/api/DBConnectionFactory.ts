/* eslint-disable @typescript-eslint/no-empty-function */
import { PrismaClient, } from '@prisma/client';
// import * as LOG from '../../utils/logger';

export class DBConnectionFactory {
    private static dbConnectionFactory: DBConnectionFactory;
    private _prisma: PrismaClient | null = null;
    private constructor() { }

    static getFactory(): DBConnectionFactory {
        if (!DBConnectionFactory.dbConnectionFactory)
            DBConnectionFactory.dbConnectionFactory = new DBConnectionFactory();
        return DBConnectionFactory.dbConnectionFactory;
    }

    get prisma(): PrismaClient {
        if (!this._prisma) {
            this._prisma = new PrismaClient();
            return this._prisma;
        } else
            return this._prisma;
    }

    async disconnect(): Promise<void> {
        if (this._prisma) {
            await this._prisma.disconnect();
            this._prisma = null;
        }
    }
}