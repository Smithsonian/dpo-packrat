/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import { Actor } from '../Actor';
import * as DBC from '../../db/connection';
import * as CACHE from '../../cache';
import { ObjectIDAndType, eAuditType, eDBObjectType, eNonSystemObjectType } from '../../db/api/ObjectType';
import { SystemObjectInvalidation } from '../../cache/SystemObjectInvalidation';
import { Config } from '../../config';
import { eEventKey } from '../../event/interface/EventEnums';
import { ASL } from '../../utils/localStore';
import { RecordKeeper as RK } from '../../records/recordKeeper';
import * as H from '../../utils/helpers';
import { buildCompactSnapshot, buildDiffPayload, DiffPayload, SnapshotPayload } from '../impl/AuditPayload';

/** Args accepted by AuditFactory.emit — the forward-looking audit API. */
export type EmitArgs = {
    /** Semantic or CRUD action; stored as Audit.AuditType. */
    action: eAuditType;
    /** Who performed the action. Required at the type level. */
    actor: Actor;
    /** Optional business-object target (populates DBObjectType + idDBObject). */
    target?: ObjectIDAndType;
    /** Explicit SystemObject id. If omitted, resolved via SystemObjectCache from target. */
    idSystemObject?: number | null;
    /** Arbitrary JSON-serializable payload written to Audit.Data. */
    payload?: unknown;
    /** Optional override for the audit row timestamp; defaults to now. */
    when?: Date;
    /** Optional correlation id for grouping related rows; column wiring is server-side. */
    correlationId?: string | null;
};

/**
 * Central audit write API. All audit rows must originate here — direct
 * prisma.audit.create calls are banned outside server/audit/** by ESLint.
 *
 * Writes are direct (no event-pipeline indirection). Cache flush and Solr
 * reindex for the target SystemObject happen AFTER the write as fire-and-forget
 * side effects via SystemObjectInvalidation.
 */
export class AuditFactory {
    /**
     * Write an audit row.
     *
     * Returns true on success. On failure, logs at critical and returns false
     * (current behavior — transactional atomicity with business writes is
     * layered in by the upcoming prisma.$transaction work).
     */
    static async emit(args: EmitArgs): Promise<boolean> {
        const action: eAuditType = args.action;
        const actor: Actor = args.actor;

        if (!Actor.isValid(actor)) {
            RK.logError(RK.LogSection.eAUDIT, 'emit refused invalid actor',
                'both idUser and SystemActor would be null', { actor, action }, 'Audit.Factory');
            return false;
        }

        const cols = Actor.toAuditColumns(actor);
        const AuditDate: Date = args.when ?? new Date();
        const DBObjectType: eDBObjectType | null = args.target?.eObjectType ?? null;
        const idDBObject: number | null = args.target?.idObject ?? null;
        const CorrelationId: string | null = args.correlationId ?? null;

        // Log-only tier: write the audit line to the logs (picked up by
        // OpenObserve) and skip the DB insert entirely. Still preserve
        // cache/Solr invalidation for mutations on SystemObjectXref — the
        // derived object must refresh even though no Audit row is persisted.
        if (AuditFactory.isLogOnlyTarget(DBObjectType)) {
            const payload = {
                action,
                actor: Actor.describe(actor),
                target: args.target,
                CorrelationId,
                payload: args.payload,
            };
            RK.logInfo(RK.LogSection.eAUDIT, `log-only ${eAuditType[action] ?? action}`,
                undefined, payload, 'Audit.Factory', /* audit */ true);

            if (DBObjectType === eNonSystemObjectType.eSystemObjectXref && idDBObject) {
                void AuditFactory.invalidateDerivedFromXref(idDBObject);
            } else if (args.idSystemObject) {
                SystemObjectInvalidation.invalidate(args.idSystemObject);
            }
            return true;
        }

        // Resolve idSystemObject synchronously from the cache if the caller
        // didn't supply it and we have a typed target.
        let idSystemObject: number | null = args.idSystemObject ?? null;
        if (idSystemObject === null && args.target && args.target.eObjectType !== eNonSystemObjectType.eAudit) {
            try {
                const SOInfo = await CACHE.SystemObjectCache.getSystemFromObjectID(args.target);
                if (SOInfo) idSystemObject = SOInfo.idSystemObject;
            } catch (err) {
                RK.logError(RK.LogSection.eAUDIT, 'idSystemObject resolve failed',
                    err instanceof Error ? err.message : String(err),
                    { target: args.target }, 'Audit.Factory');
            }
        }

        const Data: string | null = args.payload === undefined
            ? null
            : JSON.stringify(args.payload, H.Helpers.stringifyDatabaseRow);

        // If a transaction is active on the current LocalStore, buffer the row
        // into the tx-scoped buffer; it commits atomically with the business
        // write. Otherwise fall through to a direct insert (the existing path).
        const LS = ASL.getStore();
        if (LS?.auditBuffer) {
            LS.auditBuffer.push({
                idUser:         cols.idUser,
                AuditDate,
                AuditType:      action,
                DBObjectType:   DBObjectType ?? null,
                idDBObject:     idDBObject ?? null,
                idSystemObject,
                Data,
                SystemActor:    cols.SystemActor,
                CorrelationId,
            });
            if (idSystemObject && LS.invalidationQueue)
                LS.invalidationQueue.add(idSystemObject);
            return true;
        }

        try {
            await DBC.DBConnection.prisma.audit.create({
                data: {
                    User:           cols.idUser ? { connect: { idUser: cols.idUser } } : undefined,
                    AuditDate,
                    AuditType:      action,
                    DBObjectType:   DBObjectType ?? undefined,
                    idDBObject:     idDBObject ?? undefined,
                    SystemObject:   idSystemObject ? { connect: { idSystemObject } } : undefined,
                    Data,
                    SystemActor:    cols.SystemActor,
                    CorrelationId,
                },
            });
        } catch (err) {
            RK.logCritical(RK.LogSection.eAUDIT, 'audit write failed',
                err instanceof Error ? err.message : String(err),
                { action, actor: Actor.describe(actor), target: args.target, idSystemObject },
                'Audit.Factory');
            return false;
        }

        SystemObjectInvalidation.invalidate(idSystemObject);
        return true;
    }

    /**
     * True when the target entity type is enumerated in Config.audit.logOnlyObjectTypes.
     * Log-only targets bypass the Audit table and land in OpenObserve instead.
     */
    private static isLogOnlyTarget(type: eDBObjectType | null): boolean {
        if (type === null) return false;
        return Config.audit.logOnlyObjectTypes.includes(type);
    }

    /**
     * Invalidate the derived SystemObject for an xref row. Preserves the
     * cascading-refresh behavior that the retired event consumer used to
     * provide when an xref was created/updated/deleted.
     */
    private static async invalidateDerivedFromXref(idSystemObjectXref: number): Promise<void> {
        try {
            // Lazy import to avoid a static cycle through db/api -> connection.
            const { SystemObjectXref } = await import('../../db/api/SystemObjectXref');
            const xref = await SystemObjectXref.fetch(idSystemObjectXref);
            if (xref)
                SystemObjectInvalidation.invalidate(xref.idSystemObjectDerived);
        } catch (err) {
            RK.logError(RK.LogSection.eAUDIT, 'xref invalidation failed',
                err instanceof Error ? err.message : String(err),
                { idSystemObjectXref }, 'Audit.Factory');
        }
    }

    /**
     * Legacy entry point retained for DBObject.audit(). Resolves the Actor from
     * the current LocalStore and maps the event key to an AuditType. Prefer
     * AuditFactory.emit for new code.
     */
    static async audit(obj: any, oID: ObjectIDAndType, key: eEventKey): Promise<boolean> {
        const LS = ASL.getStore();
        const actor: Actor | undefined = LS?.getActor();
        if (!actor) {
            RK.logError(RK.LogSection.eAUDIT, 'audit write skipped',
                'no Actor on LocalStore — caller must run inside an entry-point scope or use withActor',
                { oID, key }, 'Audit.Factory');
            return false;
        }

        return AuditFactory.emit({
            action: AuditFactory.keyToAuditType(key),
            actor,
            target: oID,
            payload: AuditFactory.shapePayload(obj, key),
        });
    }

    /**
     * Project the DB object into the compact form written to Audit.Data.
     *
     * - For eDBUpdate on an object carrying *Orig fields, emit a diff covering
     *   only the tracked fields that actually changed.
     * - Otherwise emit a compact snapshot: scalar columns only, with long
     *   strings replaced by { __omitted, bytes } markers. No relation spreads.
     *
     * Non-DB keys (eAuthLogin, eHTTPDownload, ...) receive whatever the caller
     * passed, passed through unchanged — those payloads are already small.
     */
    private static shapePayload(obj: any, key: eEventKey): unknown {
        if (!obj || typeof obj !== 'object') return obj;

        const isDBMutation = key === eEventKey.eDBCreate
            || key === eEventKey.eDBUpdate
            || key === eEventKey.eDBDelete;
        if (!isDBMutation) return obj;

        if (key === eEventKey.eDBUpdate) {
            const tracked = AuditFactory.extractTrackedFields(obj);
            if (tracked.length > 0) {
                const before: Record<string, unknown> = {};
                const after: Record<string, unknown> = {};
                for (const field of tracked) {
                    before[field] = obj[`${field}Orig`];
                    after[field] = obj[field];
                }
                const diff: DiffPayload = buildDiffPayload(before, after, tracked);
                if (Object.keys(diff.changed).length > 0) return diff;
                // If the tracked fields didn't change, fall through to a snapshot
                // so the row still reflects what was touched.
            }
        }

        const snapshot: SnapshotPayload = buildCompactSnapshot(obj);
        return snapshot;
    }

    /** Names of mutable fields a DB API class tracks via FieldNameOrig properties. */
    private static extractTrackedFields(obj: Record<string, unknown>): string[] {
        const fields: string[] = [];
        for (const key of Object.keys(obj)) {
            if (!key.endsWith('Orig')) continue;
            const base = key.slice(0, -'Orig'.length);
            if (base && base in obj) fields.push(base);
        }
        return fields;
    }

    /** Deterministic mapping from eEventKey to eAuditType for the legacy shim. */
    static keyToAuditType(key: eEventKey): eAuditType {
        switch (key) {
            case eEventKey.eDBCreate:     return eAuditType.eDBCreate;
            case eEventKey.eDBUpdate:     return eAuditType.eDBUpdate;
            case eEventKey.eDBDelete:     return eAuditType.eDBDelete;
            case eEventKey.eAuthLogin:    return eAuditType.eAuthLogin;
            case eEventKey.eAuthFailed:   return eAuditType.eAuthFailed;
            case eEventKey.eSceneQCd:     return eAuditType.eSceneQCd;
            case eEventKey.eHTTPDownload: return eAuditType.eHTTPDownload;
            case eEventKey.eHTTPUpload:   return eAuditType.eHTTPUpload;
            case eEventKey.eSolrRebuild:  return eAuditType.eSolrRebuild;
            case eEventKey.eGenDownloads: return eAuditType.eGenDownloads;
            default:                      return eAuditType.eUnknown;
        }
    }
}
