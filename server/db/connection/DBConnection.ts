/* eslint-disable @typescript-eslint/no-empty-function */
import { PrismaClient } from '@prisma/client';

export class DBConnection {
    private static dbConnection: DBConnection;
    private _prisma: PrismaClient | null = null;
    private constructor() { }

    private static getInstance(): DBConnection {
        if (!DBConnection.dbConnection)
            DBConnection.dbConnection = new DBConnection();
        return DBConnection.dbConnection;
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
            await this._prisma.$disconnect();
            this._prisma = null;
        }
    }

    static get prisma(): PrismaClient {
        return DBConnection.getInstance().prisma;
    }

    static async disconnect(): Promise<void> {
        await DBConnection.getInstance().disconnect();
    }
}