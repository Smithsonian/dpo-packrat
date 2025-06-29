/* eslint-disable camelcase */
import { Audit as AuditBase, User as UserBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';
import { eDBObjectType, eAuditType /*, eSystemObjectType */ } from './ObjectType'; // importing eSystemObjectType causes as circular dependency
import { User } from './User';

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

    public fetchTableName(): string { return 'Audit'; }
    public fetchID(): number { return this.idAudit; }

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
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.Audit');
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
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.Audit');
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
            case eAuditType.eAuthFailed:
            case eAuditType.eSceneQCd:
            case eAuditType.eHTTPDownload:
            case eAuditType.eHTTPUpload:
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
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ idAudit, ...this },'DB.Audit');
            return null;
        }
    }

    static async fetchLastUser(idSystemObject: number, eAudit: eAuditType): Promise<User | null> {
        if (!idSystemObject || !eAudit)
            return null;
        try {
            const userBaseList: UserBase[] | null =
                await DBC.DBConnection.prisma.$queryRaw<User[]>`
                SELECT U.*
                FROM Audit AS AU
                JOIN User AS U ON (AU.idUser = U.idUser)
                WHERE AU.AuditType = ${eAudit}
                  AND AU.idSystemObject = ${idSystemObject}
                ORDER BY AU.AuditDate DESC
                LIMIT 1`;
            // LOG.info(`DBAPI.Audit.fetchLastUser(${idSystemObject}, ${eAudit}) raw ${JSON.stringify(userBaseList, H.Helpers.saferStringify)}`, LOG.LS.eDB);
            return (userBaseList && userBaseList.length > 0) ? User.constructFromPrisma(userBaseList[0]) : /* istanbul ignore next */ null;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch last User failed',H.Helpers.getErrorString(error),{ idSystemObject, eAudit, ...this },'DB.Audit');
            return null;
        }
    }
}
