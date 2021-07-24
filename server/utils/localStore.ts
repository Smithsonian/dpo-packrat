/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncLocalStorage } from 'async_hooks';
import * as LOG from './logger';

export class LocalStore {
    idRequest: number;
    idUser: number | null; // User.idUser
    private idWorkflow: number[];
    private idWorkflowStep?: number | undefined;
    private idWorkflowReport?: number | undefined;
    idWorkflowSet?: number | undefined;

    private static idRequestNext: number = 0;
    private static getIDRequestNext(): number {
        return ++LocalStore.idRequestNext;
    }

    constructor(getNextID: boolean, idUser: any | undefined) {
        this.idRequest = (getNextID) ? LocalStore.getIDRequestNext() : 0;
        this.idUser = (typeof(idUser) === 'number') ? idUser : null;
        this.idWorkflow = [];
    }

    getWorkflowID(): number | undefined {
        const idWorkflow: number | undefined = this.idWorkflow.length > 0 ? this.idWorkflow[0] : undefined;
        LOG.info(`LocalStore.getWorkflowID() = ${idWorkflow}: ${JSON.stringify(this.idWorkflow)}`, LOG.LS.eSYS);
        return idWorkflow;
    }

    pushWorkflow(idWorkflow: number, idWorkflowStep?: number | undefined): void {
        this.idWorkflow.unshift(idWorkflow);
        LOG.info(`LocalStore.pushWorkflow(${idWorkflow}): ${JSON.stringify(this.idWorkflow)}`, LOG.LS.eSYS);
        this.idWorkflowStep = idWorkflowStep;
    }

    popWorkflowID(): void {
        this.idWorkflow.shift();
        LOG.info(`LocalStore.popWorkflowID: ${JSON.stringify(this.idWorkflow)}`, LOG.LS.eSYS);
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
}

export class AsyncLocalStore extends AsyncLocalStorage<LocalStore> {
    getOrCreateStore(): LocalStore {
        const LS: LocalStore | undefined = this.getStore();
        return (LS) ? LS : new LocalStore(true, undefined);
    }
}

export const ASL: AsyncLocalStore = new AsyncLocalStore();
