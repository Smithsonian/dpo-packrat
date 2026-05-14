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
     * Active audit-row buffer during an open prisma.$transaction. Populated by
     * withAuditTransaction before entering the tx callback and cleared after.
     * AuditFactory.emit appends entries here when the buffer exists, rather than
     * writing directly — rows flush via a single tx.audit.createMany before
     * commit. Downstream code never touches this slot.
     */
    auditBuffer?: AuditBufferEntry[] | undefined;

    /**
     * SystemObject ids that need cache-flush + Solr reindex after the current
     * transaction commits. Populated alongside auditBuffer; drained by the
     * withAuditTransaction post-commit hook. Empty / undefined outside a tx.
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
