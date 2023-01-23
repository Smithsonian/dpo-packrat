/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */

import { PrismaClient } from '@prisma/client';
import { ASL, LocalStore } from '../../utils/localStore';
import * as LOG from '../../utils/logger';

export type PrismaClientTrans = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>;

export class DBConnection {
    private static dbConnection: DBConnection;
    private _prisma: PrismaClient | null = null;
    private _prismaTransMap: Map<number, PrismaClientTrans> = new Map<number, PrismaClientTrans>();
    private _prismaTransNumber: number = 0;

    private constructor() { }

    private static getInstance(): DBConnection {
        if (!DBConnection.dbConnection)
            DBConnection.dbConnection = new DBConnection();
        return DBConnection.dbConnection;
    }

    private get prisma(): PrismaClient | PrismaClientTrans {
        if (!this._prisma) {
            // configure logging of errors // warnings, queries, info
            const prisma = new PrismaClient({
                log: [
                    { level: 'error',  emit: 'event' },
                    // { level: 'warn',   emit: 'event' },
                    // { level: 'query',  emit: 'event' },
                    // { level: 'info',   emit: 'event' },
                ],
            });

            prisma.$on('error', (e) => { LOG.error(`PrismaClient error ${e.target}`, LOG.LS.eDB); });
            // prisma.$on('query', (e) => { LOG.info(e.query, LOG.LS.eDB); });

            this._prisma = prisma;
        }

        if (this._prismaTransMap.size > 0) {
            const LS: LocalStore | undefined = ASL.getStore();
            if (LS && LS.transactionNumber) {
                const PCT: PrismaClientTrans | undefined = this._prismaTransMap.get(LS.transactionNumber);
                if (PCT)
                    return PCT;
            }
        }
        return this._prisma;
    }

    private async setPrismaTransaction(prisma: PrismaClientTrans): Promise<number> {
        const transactionNumber: number = ++this._prismaTransNumber;
        this._prismaTransMap.set(transactionNumber, prisma);

        const LS: LocalStore = await ASL.getOrCreateStore();
        LS.transactionNumber = transactionNumber;

        return transactionNumber;
    }

    private clearPrismaTransaction(transactionNumber?: number | undefined): void {
        const LS: LocalStore | undefined = ASL.getStore();
        if (LS) {
            if (!transactionNumber)
                transactionNumber = LS.transactionNumber;
            LS.transactionNumber = undefined;
        }
        if (transactionNumber)
            this._prismaTransMap.delete(transactionNumber);
    }

    private async disconnect(): Promise<void> {
        if (this._prisma) {
            await this._prisma.$disconnect();
            this._prisma = null;
        }
    }

    static get prisma(): PrismaClient | PrismaClientTrans {
        return DBConnection.getInstance().prisma;
    }

    static async setPrismaTransaction(prisma: PrismaClientTrans): Promise<number> {
        return DBConnection.getInstance().setPrismaTransaction(prisma);
    }

    static clearPrismaTransaction(transactionNumber?: number | undefined): void {
        return DBConnection.getInstance().clearPrismaTransaction(transactionNumber);
    }

    static async disconnect(): Promise<void> {
        await DBConnection.getInstance().disconnect();
    }

    static isFullPrismaClient(prisma: any): prisma is PrismaClient {
        return prisma && prisma.$transaction && typeof(prisma.$transaction) === 'function';
    }
}
