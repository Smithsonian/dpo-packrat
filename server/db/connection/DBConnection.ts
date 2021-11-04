import { PrismaClient } from '@prisma/client';
import { ASL, LocalStore } from '../../utils/localStore';

type PrismaClientTrans = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>;

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

    private get prisma(): PrismaClientTrans {
        if (!this._prisma)
            this._prisma = new PrismaClient();
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
        if (!transactionNumber) {
            const LS: LocalStore | undefined = ASL.getStore();
            if (!LS || !LS.transactionNumber)
                return;
            transactionNumber = LS.transactionNumber;
        }
        this._prismaTransMap.delete(transactionNumber);
    }

    private async disconnect(): Promise<void> {
        if (this._prisma) {
            await this._prisma.$disconnect();
            this._prisma = null;
        }
    }

    static get prisma(): PrismaClientTrans {
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
}