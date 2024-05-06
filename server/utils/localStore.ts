/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncLocalStorage } from 'async_hooks';
import * as LOG from './logger';
import * as H from './helpers';

export class LocalStore {
    idRequest: number;
    idUser: number | null; // User.idUser
    private idWorkflow: number[];
    private idWorkflowStep?: number | undefined;
    private idWorkflowReport?: number | undefined;
    idWorkflowSet?: number | undefined;
    transactionNumber?: number | undefined;

    private static idRequestNext: number = 0;
    private static getIDRequestNext(): number {
        LOG.info(`LocalStore.getIDRequestNext incrementing ID. (${LocalStore.idRequestNext}->${LocalStore.idRequestNext+1})`,LOG.LS.eDEBUG);
        return ++LocalStore.idRequestNext;
    }

    constructor(getNextID: boolean, idUser: any | undefined, idRequest?: number | undefined) {
        this.idRequest = (getNextID) ? LocalStore.getIDRequestNext() : (idRequest ?? 0);
        this.idUser = (typeof(idUser) === 'number') ? idUser : null;
        this.idWorkflow = [];
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
}

export class AsyncLocalStore extends AsyncLocalStorage<LocalStore> {
    // we shouldn't need this routine as all LocalStore should be created when the request is first made
    // so the idRequest and idUser are consistent throughout all related operations.
    // TODO: phase out in favor of getStore().
    async getOrCreateStore(idUser: number | undefined = undefined): Promise<LocalStore> {
        let LS: LocalStore | undefined = this.getStore();
        if (LS) {
            LOG.info(`AsyncLocalStore.getOrCreateStore using existing store (idRequest: ${LS.idRequest} | idUser: ${LS.idUser})`,LOG.LS.eDEBUG);
            // LOG.info(`\t ${H.Helpers.getStackTrace('AsyncLocalStore.getOrCreateStore')}`,LOG.LS.eDEBUG);
            if(!LS.idUser && idUser) {
                LOG.error(`AsyncLocalStore.getOrCreateStore adding missing user id (idRequest: ${LS.idRequest} | idUser: ${LS.idUser})`,LOG.LS.eDEBUG);
                LS.idUser = idUser;
            }
            return LS;
        }

        return new Promise<LocalStore>((resolve) => {
            LS = new LocalStore(true, idUser);
            LOG.error(`AsyncLocalStore.getOrCreateStore creating a new store. lost context? (idRequest: ${LS.idRequest} | idUser: ${idUser})`,LOG.LS.eSYS);
            // LOG.error(`\t${H.Helpers.getStackTrace('AsyncLocalStore.getOrCreateStore')}`,LOG.LS.eDEBUG);
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
            LOG.error('AsyncLocalStore.clone no source store found',LOG.LS.eSYS);
            return null;
        }

        LOG.info(`AsyncLocalStore.clone from existing LocalStore (idRequest: ${src.idRequest} | idUser: ${src.idUser})`,LOG.LS.eSYS);

        // create our new LocalStore and pass in our callback function
        const LS: LocalStore = new LocalStore(false, src.idUser, src.idRequest);
        this.run(LS,fn);
        return LS;
    }

    checkLocalStore(label: string = 'LocalStore', stackTraceOnNull: boolean = false): void {
        label = `LocalStore [check: ${label}]`;
        LOG.info(`${label} (${H.Helpers.JSONStringify(this.getStore())})`,LOG.LS.eDEBUG);

        // if we don't have a store then dump the trace so we know where it came from
        if(!this.getStore() && stackTraceOnNull===true)
            LOG.info(`\t ${H.Helpers.getStackTrace(label)}`,LOG.LS.eDEBUG);
    }
}

export const ASL: AsyncLocalStore = new AsyncLocalStore();
