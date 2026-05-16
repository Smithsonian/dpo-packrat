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
    /**
     * Optional correlation id for grouping related rows. When omitted, falls
     * back to LocalStore.correlationId (minted at the entry point). Callers
     * rarely need to pass this explicitly.
     */
    correlationId?: string | null;
};

/**
 * Args accepted by emitSemantic. Identical to EmitArgs except actor is
 * optional — defaults to the entry-point Actor on LocalStore so resolver-layer
 * call sites don't have to thread it themselves.
 */
export type EmitSemanticArgs = Omit<EmitArgs, 'actor'> & { actor?: Actor };

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
     * Two delivery paths:
     *  - Buffered (atomic): when LocalStore.auditBuffer is set (inside a
     *    withAuditTransaction scope, which DBObject CRUD now enters by
     *    default), the row is pushed onto the buffer and flushes via a
     *    single tx.audit.createMany right before commit. Audit + business
     *    write commit together; a flush failure rolls back the whole tx.
     *  - Direct insert: when no buffer is set (HTTP-route telemetry, ad-hoc
     *    audit calls), the row goes straight to prisma.audit.create. No
     *    atomicity coupling because there is no business write to couple to.
     *
     * Returns true on success. On failure, logs at critical and returns
     * false; callers that need atomicity should ensure they run inside a
     * withAuditTransaction so the failure rolls back their business write.
     */
    static async emit(args: EmitArgs): Promise<boolean> {
        const action: eAuditType = args.action;
        let actor: Actor = args.actor;

        if (!Actor.isValid(actor)) {
            // Fall back to a system Unknown actor so the audit row still lands
            // rather than vanishing — log a warning so the gap is searchable.
            RK.logWarning(RK.LogSection.eAUDIT, 'emit fallback actor used',
                'caller passed invalid Actor; substituting system:Unknown so the row still writes',
                { action }, 'Audit.Factory');
            actor = Actor.system('Unknown');
        }

        const LS = ASL.getStore();
        const cols = Actor.toAuditColumns(actor);
        const AuditDate: Date = args.when ?? new Date();
        const DBObjectType: eDBObjectType | null = args.target?.eObjectType ?? null;
        const idDBObject: number | null = args.target?.idObject ?? null;
        const CorrelationId: string | null = args.correlationId ?? LS?.correlationId ?? null;

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
        // didn't supply it and we have a typed target. Two corner cases:
        //  - target.eObjectType === eSystemObject: idObject IS the
        //    idSystemObject, skip the cache lookup entirely.
        //  - non-SystemObject entities (User/Vocabulary/Metadata/...): cache
        //    returns idSystemObject=0 as a V8-Map-size sentinel; normalize
        //    that to null so the FK on Audit.idSystemObject stays satisfied.
        let idSystemObject: number | null = args.idSystemObject ?? null;
        if (idSystemObject === null && args.target && args.target.eObjectType !== eNonSystemObjectType.eAudit) {
            if (args.target.eObjectType === eNonSystemObjectType.eSystemObject) {
                idSystemObject = args.target.idObject || null;
            } else {
                try {
                    const SOInfo = await CACHE.SystemObjectCache.getSystemFromObjectID(args.target);
                    if (SOInfo && SOInfo.idSystemObject > 0) idSystemObject = SOInfo.idSystemObject;
                } catch (err) {
                    RK.logError(RK.LogSection.eAUDIT, 'idSystemObject resolve failed',
                        err instanceof Error ? err.message : String(err),
                        { target: args.target }, 'Audit.Factory');
                }
            }
        }

        const Data: string | null = args.payload === undefined
            ? null
            : JSON.stringify(args.payload, H.Helpers.stringifyDatabaseRow);

        // If a transaction is active on the current LocalStore, buffer the row
        // into the tx-scoped buffer; it commits atomically with the business
        // write. Otherwise fall through to a direct insert (the existing path).
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
     * Wrapper for semantic business-action emissions (publish, license,
     * rollback, ingest, access grant, etc.). Behaves identically to emit()
     * except the Actor defaults to LocalStore.getActor() when omitted, which
     * matches the typical resolver-layer call shape: the HTTP middleware has
     * already resolved the Actor onto LocalStore by the time the resolver
     * fires, so the call site shouldn't have to thread it through.
     *
     * Returns false if no Actor can be resolved.
     */
    static async emitSemantic(args: EmitSemanticArgs): Promise<boolean> {
        // Fall back to system:Unknown when no Actor can be resolved from
        // LocalStore — keeps the row intact and searchable rather than
        // dropping the emit when the entry-point didn't establish an Actor.
        let actor: Actor | undefined = args.actor ?? ASL.getStore()?.getActor();
        if (!actor) {
            RK.logWarning(RK.LogSection.eAUDIT, 'emitSemantic fallback actor used',
                'no Actor on LocalStore; substituting system:Unknown — entry-point should establish an Actor',
                { action: args.action, target: args.target }, 'Audit.Factory');
            actor = Actor.system('Unknown');
        }
        return AuditFactory.emit({ ...args, actor });
    }

    /**
     * Like emit() but always writes the row eagerly (never buffered) and
     * returns the created idAudit. Use this when a follow-up row needs to
     * reference the first row's primary key — e.g. retirement-cascade children
     * carrying Data.parentRetirement.idAudit.
     *
     * Still participates in the active transaction when one is open (via
     * DBConnection.prisma auto-resolving to the tx client), so the row commits
     * atomically with the surrounding business write.
     *
     * Log-only tiers return null because no DB row exists.
     */
    static async emitWithId(args: EmitArgs): Promise<number | null> {
        const action: eAuditType = args.action;
        let actor: Actor = args.actor;

        if (!Actor.isValid(actor)) {
            RK.logWarning(RK.LogSection.eAUDIT, 'emitWithId fallback actor used',
                'caller passed invalid Actor; substituting system:Unknown so the row still writes',
                { action }, 'Audit.Factory');
            actor = Actor.system('Unknown');
        }

        const LS = ASL.getStore();
        const cols = Actor.toAuditColumns(actor);
        const AuditDate: Date = args.when ?? new Date();
        const DBObjectType: eDBObjectType | null = args.target?.eObjectType ?? null;
        const idDBObject: number | null = args.target?.idObject ?? null;
        const CorrelationId: string | null = args.correlationId ?? LS?.correlationId ?? null;

        if (AuditFactory.isLogOnlyTarget(DBObjectType)) {
            // Log-only has no persistent row; delegate to emit() for the log
            // line and return null so the caller knows there is no id to link.
            await AuditFactory.emit(args);
            return null;
        }

        let idSystemObject: number | null = args.idSystemObject ?? null;
        if (idSystemObject === null && args.target && args.target.eObjectType !== eNonSystemObjectType.eAudit) {
            if (args.target.eObjectType === eNonSystemObjectType.eSystemObject) {
                idSystemObject = args.target.idObject || null;
            } else {
                try {
                    const SOInfo = await CACHE.SystemObjectCache.getSystemFromObjectID(args.target);
                    if (SOInfo && SOInfo.idSystemObject > 0) idSystemObject = SOInfo.idSystemObject;
                } catch (err) {
                    RK.logError(RK.LogSection.eAUDIT, 'idSystemObject resolve failed',
                        err instanceof Error ? err.message : String(err),
                        { target: args.target }, 'Audit.Factory');
                }
            }
        }

        const Data: string | null = args.payload === undefined
            ? null
            : JSON.stringify(args.payload, H.Helpers.stringifyDatabaseRow);

        try {
            const row = await DBC.DBConnection.prisma.audit.create({
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
                select: { idAudit: true },
            });

            // Queue invalidation: inside a wrapped tx it fires post-commit;
            // outside a tx it fires immediately.
            if (idSystemObject) {
                if (LS?.invalidationQueue)
                    LS.invalidationQueue.add(idSystemObject);
                else
                    SystemObjectInvalidation.invalidate(idSystemObject);
            }
            return row.idAudit;
        } catch (err) {
            RK.logCritical(RK.LogSection.eAUDIT, 'audit write failed (withId)',
                err instanceof Error ? err.message : String(err),
                { action, actor: Actor.describe(actor), target: args.target, idSystemObject },
                'Audit.Factory');
            return null;
        }
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
     * Resolve the tier for an action via Config.audit.actionTiers, falling back to
     * Config.audit.defaultUnmappedTier when the action has no explicit entry.
     * Surfaced for the startup self-check and the retention job.
     */
    static resolveTier(action: eAuditType): import('../../config').AuditTier {
        const explicit = Config.audit.actionTiers[action];
        return explicit ?? Config.audit.defaultUnmappedTier;
    }

    /**
     * Walk every numeric eAuditType value and warn for any missing actionTiers
     * entry. Called once at server startup. Does not throw — a missing entry now
     * resolves to defaultUnmappedTier (STANDARD) rather than silently disappearing.
     */
    static auditTierCoverageSelfCheck(): { missing: eAuditType[] } {
        const missing: eAuditType[] = [];
        for (const key of Object.keys(eAuditType)) {
            const numeric = Number(key);
            if (!Number.isFinite(numeric)) continue;
            if (numeric === eAuditType.eUnknown) continue;
            if (Config.audit.actionTiers[numeric as eAuditType] === undefined)
                missing.push(numeric as eAuditType);
        }
        if (missing.length > 0) {
            RK.logWarning(RK.LogSection.eAUDIT, 'audit tier coverage gap',
                `${missing.length} eAuditType value(s) missing from actionTiers; falling back to ${Config.audit.defaultUnmappedTier}`,
                { missing: missing.map(m => `${eAuditType[m]} (${m})`), fallback: Config.audit.defaultUnmappedTier },
                'Audit.Factory');
        }
        return { missing };
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
        // Fall back to system:Unknown when no Actor can be resolved — keeps the
        // audit row intact rather than dropping it when LocalStore is missing
        // (e.g. test scopes where ASL.enterWith() didn't propagate across an
        // async boundary). Production HTTP middleware / withActor always set
        // an Actor so this branch should never fire in production paths.
        let actor: Actor | undefined = LS?.getActor();
        if (!actor) {
            RK.logWarning(RK.LogSection.eAUDIT, 'audit fallback actor used',
                'no Actor on LocalStore; substituting system:Unknown — entry-point should establish an Actor',
                { oID, key }, 'Audit.Factory');
            actor = Actor.system('Unknown');
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
