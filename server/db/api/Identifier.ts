/* eslint-disable camelcase */
import { Identifier as IdentifierBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Identifier extends DBC.DBObject<IdentifierBase> implements IdentifierBase {
    idIdentifier!: number;
    IdentifierValue!: string;
    idSystemObject!: number | null;
    idVIdentifierType!: number;

    constructor(input: IdentifierBase) {
        super(input);
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { IdentifierValue, idVIdentifierType, idSystemObject } = this;
            ({ idIdentifier: this.idIdentifier, IdentifierValue: this.IdentifierValue,
                idVIdentifierType: this.idVIdentifierType, idSystemObject: this.idSystemObject } =
                await DBC.DBConnection.prisma.identifier.create({
                    data: {
                        IdentifierValue,
                        Vocabulary: { connect: { idVocabulary: idVIdentifierType }, },
                        SystemObject: idSystemObject ? { connect: { idSystemObject }, } : undefined,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Identifier.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idIdentifier, IdentifierValue, idVIdentifierType, idSystemObject } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.identifier.update({
                where: { idIdentifier, },
                data: {
                    IdentifierValue,
                    Vocabulary: { connect: { idVocabulary: idVIdentifierType }, },
                    SystemObject: idSystemObject ? { connect: { idSystemObject }, } : { disconnect: true, },
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Identifier.update', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idIdentifier: number): Promise<Identifier | null> {
        if (!idIdentifier)
            return null;
        try {
            return DBC.CopyObject<IdentifierBase, Identifier>(
                await DBC.DBConnection.prisma.identifier.findUnique({ where: { idIdentifier, }, }), Identifier);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Identifier.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromIdentifierValue(IdentifierValue: string): Promise<Identifier[] | null> {
        if (!IdentifierValue) return null;
        try {
            return DBC.CopyArray<IdentifierBase, Identifier>(
                await DBC.DBConnection.prisma.identifier.findMany({ where: { IdentifierValue, }, }), Identifier);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Identifier.fetchFromIdentifierValue', LOG.LS.eDB, error);
            return null;
        }
    }

    /** Returns Identifier specified by Subject.idIdentifierPreferred */
    static async fetchFromSubjectPreferred(idSubject: number): Promise<Identifier | null> {
        if (!idSubject)
            return null;
        try {
            const IDArray: Identifier[] | null =
                DBC.CopyArray<IdentifierBase, Identifier>(
                    await DBC.DBConnection.prisma.$queryRaw<Identifier[]>`
                    SELECT I.*
                    FROM Identifier AS I
                    JOIN Subject AS S ON (I.idIdentifier = S.idIdentifierPreferred)
                    WHERE S.idSubject = ${idSubject}`, Identifier);
            return (IDArray && IDArray.length > 0) ? IDArray[0] : /* istanbul ignore next */ null;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Identifier.fetchFromSubjectPreferred', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<Identifier[] | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBC.CopyArray<IdentifierBase, Identifier>(
                await DBC.DBConnection.prisma.identifier.findMany({ where: { idSystemObject } }), Identifier);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Identifier.fetchFromSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }
}
