/* eslint-disable camelcase */
import { Audit as AuditBase, User as UserBase, Prisma } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';
import { eDBObjectType, eAuditType /*, eSystemObjectType */ } from './ObjectType'; // importing eSystemObjectType causes as circular dependency
import { User } from './User';

export type AuditDenialRow = {
    idAudit: number;
    AuditDate: Date;
    idUser: number | null;
    UserName: string | null;
    EmailAddress: string | null;
    idSystemObject: number | null;
    Data: string | null;
};

/**
 * Per-SystemObject lifeline row: one audit event with actor and payload fields
 * joined for display. AuditTypeName is the reverse-mapped enum name for human
 * readers; Data is the raw JSON string from the column (callers parse as needed
 * to follow links like Data.parentRetirement.idAudit).
 */
export type AuditLifelineRow = {
    idAudit: number;
    AuditDate: Date;
    idUser: number | null;
    UserName: string | null;
    EmailAddress: string | null;
    SystemActor: string | null;
    AuditType: number;
    AuditTypeName: string;
    DBObjectType: number | null;
    idDBObject: number | null;
    idSystemObject: number | null;
    Data: string | null;
    CorrelationId: string | null;
};

export type AuditLifelineOptions = {
    /** Rows to skip from the head of the result set. Default 0. */
    offset?: number;
    /** Max rows to return. Default 50. Clamped to [1, 500]. */
    limit?: number;
    /** True (default) returns newest-first; false returns oldest-first. */
    descending?: boolean;
};

export type AuditLifelineResult = {
    rows: AuditLifelineRow[];
    /** Total matching rows ignoring offset/limit — for paging the UI. */
    total: number;
};

export class Audit extends DBC.DBObject<AuditBase> implements AuditBase {
    idAudit!: number;
    idUser!: number | null;
    AuditDate!: Date;
    AuditType!: number;
    DBObjectType!: number | null;
    idDBObject!: number | null;
    idSystemObject!: number | null;
    Data!: string | null;
    SystemActor!: string | null;
    CorrelationId!: string | null;

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
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ id: this.fetchID() },'DB.Audit');
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
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ id: this.fetchID() },'DB.Audit');
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
            case eAuditType.eAuthDenied:
            case eAuditType.eSceneQCd:
            case eAuditType.eHTTPDownload:
            case eAuditType.eHTTPUpload:
            case eAuditType.eSolrRebuild:
            case eAuditType.eAuthGranted:
            case eAuditType.eAuthRevoked:
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
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ idAudit },'DB.Audit');
            return null;
        }
    }

    static async fetchAuthDenialsByDateRange(startDate: Date, endDate: Date): Promise<AuditDenialRow[]> {
        try {
            return await DBC.DBConnection.prisma.$queryRaw<AuditDenialRow[]>`
                SELECT AU.idAudit, AU.AuditDate, AU.idUser, U.Name AS UserName, U.EmailAddress, AU.idSystemObject, AU.Data
                FROM Audit AS AU
                LEFT JOIN User AS U ON (AU.idUser = U.idUser)
                WHERE AU.AuditType = 9
                  AND AU.AuditDate BETWEEN ${startDate} AND ${endDate}
                ORDER BY AU.AuditDate DESC`;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetchAuthDenialsByDateRange failed',H.Helpers.getErrorString(error),{ startDate, endDate },'DB.Audit');
            return [];
        }
    }

    /**
     * Null out Data for one batch of rows whose AuditType is in `tiers` and
     * whose AuditDate is older than `cutoff`. Returns the rows affected.
     * Used by the retention job's skeleton pass on STANDARD and TRANSIENT
     * tiers — the row shell survives forever; only the payload is dropped.
     *
     * Before the UPDATE runs we snapshot the affected rows and emit them as
     * a log line with `audit=true` so OpenObserve preserves the about-to-be-
     * dropped Data for the configured log retention window. This gives
     * operators a recovery path if a tier-window mistake nukes a payload that
     * was still wanted.
     */
    static async skeletonBefore(tiers: eAuditType[], cutoff: Date, batchSize: number): Promise<number> {
        if (tiers.length === 0 || batchSize <= 0) return 0;
        try {
            const inList = Prisma.join(tiers);
            const target = await DBC.DBConnection.prisma.audit.findMany({
                where: {
                    AuditType: { in: tiers as number[] },
                    AuditDate: { lt: cutoff },
                    Data: { not: null },
                },
                take: batchSize,
            });

            if (target.length > 0) {
                RK.logInfo(RK.LogSection.eAUDIT, 'retention skeleton snapshot',
                    `nulling Data on ${target.length} audit row(s)`,
                    { count: target.length, cutoff, rows: target },
                    'DB.Audit', /* audit */ true);
            }

            const result = await DBC.DBConnection.prisma.$executeRaw`
                UPDATE Audit SET Data = NULL
                WHERE AuditType IN (${inList})
                  AND AuditDate < ${cutoff}
                  AND Data IS NOT NULL
                LIMIT ${batchSize}`;
            return Number(result);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB, 'skeletonBefore failed',
                H.Helpers.getErrorString(error),
                { tiersCount: tiers.length, cutoff, batchSize }, 'DB.Audit');
            return 0;
        }
    }

    /**
     * Delete one batch of rows whose AuditType is in `tiers` and whose
     * AuditDate is older than `cutoff`. Returns the rows affected.
     * Used by the retention job's delete pass on TRANSIENT tier.
     *
     * Before the DELETE runs we snapshot the full row content and emit it as
     * a log line with `audit=true` so the deletion is itself audited and the
     * row content is preserved in OpenObserve for its retention window.
     */
    static async deleteBefore(tiers: eAuditType[], cutoff: Date, batchSize: number): Promise<number> {
        if (tiers.length === 0 || batchSize <= 0) return 0;
        try {
            const inList = Prisma.join(tiers);
            const target: AuditBase[] = await DBC.DBConnection.prisma.audit.findMany({
                where: {
                    AuditType: { in: tiers as number[] },
                    AuditDate: { lt: cutoff },
                },
                take: batchSize,
            });

            if (target.length > 0) {
                RK.logInfo(RK.LogSection.eAUDIT, 'retention delete snapshot',
                    `deleting ${target.length} audit row(s)`,
                    { count: target.length, cutoff, rows: target },
                    'DB.Audit', /* audit */ true);
            }

            const result = await DBC.DBConnection.prisma.$executeRaw`
                DELETE FROM Audit
                WHERE AuditType IN (${inList})
                  AND AuditDate < ${cutoff}
                LIMIT ${batchSize}`;
            return Number(result);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB, 'deleteBefore failed',
                H.Helpers.getErrorString(error),
                { tiersCount: tiers.length, cutoff, batchSize }, 'DB.Audit');
            return 0;
        }
    }

    /**
     * Return every audit row referencing the given SystemObject, ordered by date.
     * Used by the admin lifeline endpoint. Each row carries the actor (idUser+name
     * or SystemActor), action, parsed enum name, payload, and correlation id so a
     * consumer can render the full history of one object in one call.
     */
    static async fetchByIdSystemObject(idSystemObject: number, options: AuditLifelineOptions = {}): Promise<AuditLifelineResult> {
        if (!idSystemObject) return { rows: [], total: 0 };

        const offset: number = Math.max(0, Math.floor(options.offset ?? 0));
        const rawLimit: number = Math.floor(options.limit ?? 50);
        const limit: number = Math.max(1, Math.min(500, rawLimit));
        const orderClause = options.descending === false ? Prisma.sql`ASC` : Prisma.sql`DESC`;

        try {
            const rawRows = await DBC.DBConnection.prisma.$queryRaw<Array<{
                idAudit: number;
                AuditDate: Date;
                idUser: number | null;
                UserName: string | null;
                EmailAddress: string | null;
                SystemActor: string | null;
                AuditType: number;
                DBObjectType: number | null;
                idDBObject: number | null;
                idSystemObject: number | null;
                Data: string | null;
                CorrelationId: string | null;
            }>>`
                SELECT AU.idAudit, AU.AuditDate, AU.idUser, U.Name AS UserName, U.EmailAddress,
                       AU.SystemActor, AU.AuditType, AU.DBObjectType, AU.idDBObject, AU.idSystemObject,
                       AU.Data, AU.CorrelationId
                FROM Audit AS AU
                LEFT JOIN User AS U ON (AU.idUser = U.idUser)
                WHERE AU.idSystemObject = ${idSystemObject}
                ORDER BY AU.AuditDate ${orderClause}, AU.idAudit ${orderClause}
                LIMIT ${limit} OFFSET ${offset}`;

            const totalRow = await DBC.DBConnection.prisma.$queryRaw<Array<{ total: bigint | number }>>`
                SELECT COUNT(*) AS total FROM Audit WHERE idSystemObject = ${idSystemObject}`;
            const total: number = Number(totalRow[0]?.total ?? 0);

            const rows: AuditLifelineRow[] = rawRows.map(r => ({
                ...r,
                AuditTypeName: eAuditType[r.AuditType] ?? `eAuditType(${r.AuditType})`,
            }));
            return { rows, total };
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB, 'fetchByIdSystemObject failed',
                H.Helpers.getErrorString(error), { idSystemObject, options }, 'DB.Audit');
            return { rows: [], total: 0 };
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
            RK.logError(RK.LogSection.eDB,'fetch last User failed',H.Helpers.getErrorString(error),{ idSystemObject, eAudit },'DB.Audit');
            return null;
        }
    }
}
