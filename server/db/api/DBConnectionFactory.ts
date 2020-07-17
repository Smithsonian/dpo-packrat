/* eslint-disable @typescript-eslint/no-empty-function */
import { PrismaClient, } from '@prisma/client';

export class DBConnectionFactory {
    private static dbConnectionFactory: DBConnectionFactory;
    private _prisma: PrismaClient | null = null;
    private constructor() { }

    private static getFactory(): DBConnectionFactory {
        if (!DBConnectionFactory.dbConnectionFactory)
            DBConnectionFactory.dbConnectionFactory = new DBConnectionFactory();
        return DBConnectionFactory.dbConnectionFactory;
    }

    private get prisma(): PrismaClient {
        if (!this._prisma) {
            this._prisma = new PrismaClient();
            return this._prisma;
        } else
            return this._prisma;
    }

    private async disconnect(): Promise<void> {
        if (this._prisma) {
            await this._prisma.disconnect();
            this._prisma = null;
        }
    }

    static get prisma(): PrismaClient {
        return DBConnectionFactory.getFactory().prisma;
    }

    static async disconnect(): Promise<void> {
        await DBConnectionFactory.getFactory().disconnect();
    }
}