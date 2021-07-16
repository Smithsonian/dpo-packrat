/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncLocalStorage } from 'async_hooks';

export const ASL: AsyncLocalStorage<LocalStore> = new AsyncLocalStorage<LocalStore>();

export class LocalStore {
    idRequest: number;
    idUser: number | null; // User.idUser
    idWorkflow?: number | undefined;
    idWorkflowStep?: number | undefined;
    idWorkflowReport?: number | undefined;

    private static idRequestNext: number = 0;
    private static getIDRequestNext(): number {
        return ++LocalStore.idRequestNext;
    }

    constructor(getNextID: boolean, idUser: any | undefined) {
        this.idRequest = (getNextID) ? LocalStore.getIDRequestNext() : 0;
        this.idUser = (typeof(idUser) === 'number') ? idUser : null;
    }
}