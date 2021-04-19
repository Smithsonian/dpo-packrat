/* eslint-disable camelcase */
import { Audit as AuditBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';
import { eDBObjectType /*, eSystemObjectType */ } from './SystemObjectPairs'; // importing eSystemObjectType causes as circular dependency

export enum eAuditType {
    eUnknown = 0,
    eDBCreate = 1,
    eDBUpdate = 2,
    eDBDelete = 3,
    eAuthLogin = 4,
}

export class Audit extends DBC.DBObject<AuditBase> implements AuditBase {
    idAudit!: number;
    idUser!: number | null;
    AuditDate!: Date;
    AuditType!: number;
    DBObjectType!: number | null;
    idDBObject!: number | null;
    idSystemObject!: number | null;
    Data!: string | null;

    constructor(input: AuditBase) {
        super(input);
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idUser, AuditDate, AuditType, DBObjectType, idDBObject, idSystemObject, Data } = this;
            ({ idAudit: this.idAudit, idUser: this.idUser, AuditDate: this.AuditDate, AuditType: this.AuditType,
                DBObjectType: this.DBObjectType, idDBObject: this.idDBObject, idSystemObject: this.idSystemObject, Data: this.Data } =
                await DBC.DBConnection.prisma.audit.create({ data: {
                    User:           idUser ? { connect: { idUser }, } : undefined,
                    AuditDate, AuditType, DBObjectType, idDBObject,
                    SystemObject:   idSystemObject ? { connect: { idSystemObject }, } : undefined,
                    Data
                } }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Audit.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idAudit, idUser, AuditDate, AuditType, DBObjectType, idDBObject, idSystemObject, Data } = this;
            return await DBC.DBConnection.prisma.audit.update({
                where: { idAudit, },
                data: {
                    User:           idUser ? { connect: { idUser }, } : { disconnect: true },
                    AuditDate, AuditType, DBObjectType, idDBObject,
                    SystemObject:   idSystemObject ? { connect: { idSystemObject }, } : { disconnect: true },
                    Data
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Audit.update', LOG.LS.eDB, error);
            return false;
        }
    }

    setAuditType(eType: eAuditType): void {
        this.AuditType = eType;
    }

    getAuditType(): eAuditType {
        switch (this.AuditType) {
            case eAuditType.eUnknown:
            case eAuditType.eDBCreate:
            case eAuditType.eDBUpdate:
            case eAuditType.eDBDelete:
            case eAuditType.eAuthLogin:
                return this.AuditType; /* istanbul ignore next */
            default: return eAuditType.eUnknown;
        }
    }

    setDBObjectType(dbObjectType: eDBObjectType | null): void {
        this.DBObjectType = dbObjectType;
    }

    getDBObjectType(): eDBObjectType {
        return this.DBObjectType ?? 0; // eSystemObjectType.eUnknown;
    }

    static async fetch(idAudit: number): Promise<Audit | null> {
        if (!idAudit)
            return null;
        try {
            return DBC.CopyObject<AuditBase, Audit>(
                await DBC.DBConnection.prisma.audit.findUnique({ where: { idAudit, }, }), Audit);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Audit.fetch', LOG.LS.eDB, error);
            return null;
        }
    }
}
