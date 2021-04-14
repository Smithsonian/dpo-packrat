/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncLocalStorage } from 'async_hooks';
import * as DBAPI from '../db';

export const ASL: AsyncLocalStorage<LocalStore> = new AsyncLocalStorage<LocalStore>();

export class LocalStore {
    idRequest: number;
    user: DBAPI.User | null;

    private static idRequestNext: number = 0;
    private static getIDRequestNext(): number {
        return ++LocalStore.idRequestNext;
    }

    constructor(getNextID: boolean, user: any | undefined) {
        this.idRequest = (getNextID) ? LocalStore.getIDRequestNext() : 0;
        this.user = (user instanceof DBAPI.User) ? user : null;
    }
}