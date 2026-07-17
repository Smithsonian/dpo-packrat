/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncLocalStorage, AsyncResource } from 'async_hooks';
import * as H from './helpers';
import { RecordKeeper as RK } from '../records/recordKeeper';
import type { AuthorizationContext } from '../auth/Authorization';
import { Actor } from '../audit/Actor';
import type { AuditBufferEntry } from '../audit/auditBuffer';

export class LocalStore {
    idRequest: number;
    idUser: number | null; // User.idUser
    userEmail: string | null;
    userNotify: boolean;
    userSlack: string | null;
    private idWorkflow: number[];
    private idWorkflowStep?: number | undefined;
    private idWorkflowReport?: number | undefined;
    idWorkflowSet?: number | undefined;
    transactionNumber?: number | undefined;
    authContext?: AuthorizationContext | undefined;
    /**
     * Set once at the entry-point (HTTP middleware, GraphQL context, scheduled-job
     * wrapper). Audit writers read via `getActor()` which falls back to
     * `user(idUser)` when this slot is empty and idUser is known. Never populated
     * from downstream code.
     */
    actor?: Actor | undefined;

    /**
     * Active audit-row buffer during an open prisma.$transaction. Lives only
     * on the per-wrap *child* LocalStore that withAuditTransaction creates via
     * forkChildScope() — the parent that the entry-point established is never
     * mutated. AuditFactory.emit appends entries here when it sees the slot
     * set on the current ASL store (which inside a wrap is the child); rows
     * flush via a single tx.audit.createMany before commit.
     *
     * INTERNAL: this slot is private to withAuditTransaction.ts and
     * AuditFactory.ts. Reading or writing it from any other code path is
     * unsupported and will produce surprising results (undefined outside a
     * wrap; a wrap's in-flight buffer only via ASL.getStore() inside the
     * wrap body; never visible on the parent LocalStore).
     */
    auditBuffer?: AuditBufferEntry[] | undefined;

    /**
     * SystemObject ids that need cache-flush + Solr reindex after the current
     * transaction commits. Lives on the same per-wrap child LocalStore as
     * auditBuffer; populated by AuditFactory.emit during the wrap, drained
     * by withAuditTransaction's post-commit hook.
     *
     * INTERNAL: this slot is private to withAuditTransaction.ts and
     * AuditFactory.ts. Same visibility rules as auditBuffer — adds made from
     * outside the wrap go onto the parent LocalStore, where nothing drains
     * them, and would silently leak.
     */
    invalidationQueue?: Set<number> | undefined;

    /**
     * Stable UUID shared by every audit row produced under this scope.
     * Set once at the entry-point (HTTP middleware / withActor) and read by
     * AuditFactory at emit time. All audit rows from one HTTP request, one
     * Cook job, or one scheduled run share this value so a downstream query
     * can group "everything that happened in one operation".
     */
    correlationId: string | null = null;

    /**
     * Per-request UUID surfaced to the client as an error/trace reference (shown as a
     * short prefix in error toasts and logged on every RecordKeeper record for the
     * request). Distinct from correlationId, which groups an operation's audit rows and
     * may span multiple requests for one user action.
     */
    traceId: string | null = null;

    private static idRequestNext: number = 0;
    private static getIDRequestNext(): number {
        // RK.logDebug(RK.LogSection.eSYS,'incrementing ID',undefined,{ idRequest: LocalStore.idRequestNext, idRequestNew: LocalStore.idRequestNext+1 },'AsyncLocalStore');
        return ++LocalStore.idRequestNext;
    }

    constructor(getNextID: boolean, idUser: any | undefined, idRequest?: number | undefined) {
        this.idRequest = (getNextID) ? LocalStore.getIDRequestNext() : (idRequest ?? 0);
        this.idUser = (typeof(idUser) === 'number') ? idUser : null;
        this.idWorkflow = [];
        this.userEmail = null;
        this.userNotify = false;
        this.userSlack = null;
    }

    /**
     * Build a sibling LocalStore that inherits identity/correlation/auth slots
     * from this one but starts with no audit-buffer / invalidation-queue / tx
     * binding. Used by withAuditTransaction to give each wrap its own private
     * scope, so concurrent or async-leaked sibling wraps cannot clobber each
     * other's auditBuffer (the bug that prompted this helper).
     *
     * Identity fields are copied so audit rows written inside the wrap carry
     * the same actor / idUser / correlationId / authContext as the parent.
     * The workflow stack is intentionally NOT copied — pushes inside a wrap
     * land on the child and disappear when the wrap returns, matching the
     * existing LocalStore.clone() contract (changes do not propagate out).
     */
    forkChildScope(): LocalStore {
        const child = new LocalStore(false, this.idUser, this.idRequest);
        child.actor = this.actor;
        child.correlationId = this.correlationId;
        child.traceId = this.traceId;
        child.authContext = this.authContext;
        child.userEmail = this.userEmail;
        child.userNotify = this.userNotify;
        child.userSlack = this.userSlack;
        // auditBuffer / invalidationQueue / transactionNumber intentionally
        // left undefined — the caller sets them for the duration of the wrap.
        return child;
    }

    setUserNotify(email: string, doNotify: boolean = false, slackID?: string): void {
        this.userEmail = email;
        this.userSlack = slackID ?? null;
        this.userNotify = doNotify;
    }

    getWorkflowID(): number | undefined {
        const idWorkflow: number | undefined = this.idWorkflow.length > 0 ? this.idWorkflow[0] : undefined;
        // LOG.info(`LocalStore.getWorkflowID() = ${idWorkflow}: ${JSON.stringify(this.idWorkflow)}`, LOG.LS.eSYS);
        return idWorkflow;
    }

    pushWorkflow(idWorkflow: number, idWorkflowStep?: number | undefined): void {
        this.idWorkflow.unshift(idWorkflow);
        // LOG.info(`LocalStore.pushWorkflow(${idWorkflow}): ${JSON.stringify(this.idWorkflow)}`, LOG.LS.eSYS);
        this.idWorkflowStep = idWorkflowStep;
    }

    popWorkflowID(): void {
        this.idWorkflow.shift();
        // LOG.info(`LocalStore.popWorkflowID: ${JSON.stringify(this.idWorkflow)}`, LOG.LS.eSYS);
        this.idWorkflowReport = undefined;
    }

    getWorkflowStepID(): number | undefined {
        return this.idWorkflowStep;
    }

    setWorkflowStepID(idWorkflowStep: number | undefined): void {
        this.idWorkflowStep = idWorkflowStep;
    }

    getWorkflowReportID(): number | undefined {
        return this.idWorkflowReport;
    }

    setWorkflowReportID(idWorkflowReport: number | undefined): void {
        this.idWorkflowReport = idWorkflowReport;
    }

    incrementRequestID(): void {
        this.idRequest = LocalStore.getIDRequestNext();
    }

    /**
     * Returns the Actor for audit-row attribution.
     * - If an explicit Actor was set at entry, returns it.
     * - Otherwise falls back to user(idUser) when idUser is known.
     * - Otherwise undefined — caller must supply a system Actor explicitly.
     */
    getActor(): Actor | undefined {
        if (this.actor) return this.actor;
        if (typeof this.idUser === 'number') return Actor.user(this.idUser);
        return undefined;
    }
}

export class AsyncLocalStore extends AsyncLocalStorage<LocalStore> {
    // we shouldn't need this routine as all LocalStore should be created when the request is first made
    // so the idRequest and idUser are consistent throughout all related operations.
    // TODO: phase out in favor of getStore().
    async getOrCreateStore(idUser: number | undefined = undefined, logUse: boolean = false): Promise<LocalStore> {
        let LS: LocalStore | undefined = this.getStore();
        if (LS) {
            if(logUse===true)
                RK.logDebug(RK.LogSection.eSYS,'using existing LocalStore',undefined,{ idRequest: LS.idRequest, idUser: LS.idUser },'AsyncLocalStore');

            if(!LS.idUser && idUser) {
                RK.logDebug(RK.LogSection.eSYS,'adding missing user id',undefined,{ idRequest: LS.idRequest, idUser: LS.idUser },'AsyncLocalStore');
                LS.idUser = idUser;
            }
            return LS;
        }

        return new Promise<LocalStore>((resolve) => {
            LS = new LocalStore(true, idUser);
            if(logUse===true)
                RK.logDebug(RK.LogSection.eSYS,'creating new LocalStore','no context found',{ idRequest: LS.idRequest, idUser: LS.idUser },'AsyncLocalStore');
            this.run(LS, () => { resolve(LS!); }); // eslint-disable-line @typescript-eslint/no-non-null-assertion
        });
    }

    clone(src: LocalStore | undefined, fn: () => unknown): LocalStore | null {
        // creates a new LocalStore based on an existing one. This is used for wrappers
        // around non-async libraries and preserves the context info entering a new
        // context for logging/auditing.
        //
        // NOTE: any changes DO NOT propagate back out to the previous context.

        // if we don't have a source, get from the current store
        src = src ?? this.getStore();
        if(!src) {
            RK.logError(RK.LogSection.eSYS,'clone LocalStore failed','no source store found',undefined,'AsyncLocalStore');
            return null;
        }

        RK.logDebug(RK.LogSection.eSYS,'clone LocalStore',undefined,{ idRequest: src.idRequest, idUser: src.idUser },'AsyncLocalStore');

        // create our new LocalStore and pass in our callback function
        const LS: LocalStore = new LocalStore(false, src.idUser, src.idRequest);
        this.run(LS,fn);
        return LS;
    }

    checkLocalStore(label: string = 'LocalStore', logUndefined: boolean = false): void {
        label = `LocalStore [check: ${label}]`;
        RK.logDebug(RK.LogSection.eSYS,'check LocalStore',undefined,{ ...this.getStore() },'AsyncLocalStore');

        // if we don't have a store then dump the trace so we know where it came from
        if(!this.getStore() && logUndefined===true)
            RK.logDebug(RK.LogSection.eSYS,'check LocalStore failed',undefined,{ trace: H.Helpers.getStackTrace(label) },'AsyncLocalStore');
    }
}

export { AsyncResource as ASR };
export const ASL: AsyncLocalStore = new AsyncLocalStore();
