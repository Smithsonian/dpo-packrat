import { eDBObjectType, eNonSystemObjectType, ObjectIDAndType, DBObjectNameToType } from '../api/ObjectType';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import { eEventKey } from '../../event/interface/EventEnums';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

const DB_OPERATION_RETRIES: number = 3;
const DB_OPERATION_RETRY_DELAY: number = 1500;

export abstract class DBObject<T> {
    public abstract fetchTableName(): string;
    public abstract fetchID(): number;

    protected abstract createWorker(): Promise<boolean>;
    protected abstract updateWorker(): Promise<boolean>;
    protected async deleteWorker(): Promise<boolean> { return false; }
    protected static async createManyWorker<T>(_data: DBObject<T>[]): Promise<boolean> { return false; }
    protected updateCachedValues(): void { }

    constructor(input: T) {
        Object.assign(this, input);
        this.updateCachedValues();
    }

    protected computeObjectIDAndType(): ObjectIDAndType {
        const idObject: number = this.fetchID();
        const eObjectType: eDBObjectType = DBObjectNameToType(this.fetchTableName());
        return { idObject, eObjectType };
    }

    public async audit(key: eEventKey): Promise<boolean> {
        const oID: ObjectIDAndType = this.computeObjectIDAndType();
        if (oID.eObjectType != eNonSystemObjectType.eAudit)
            return AuditFactory.audit(this, oID, key);
        return true;
    }

    async create(): Promise<boolean> {
        for (let retry = 1; retry <= DB_OPERATION_RETRIES; retry++) {
            if (await this.createWorker()) /* istanbul ignore else */ {
                this.updateCachedValues();
                this.audit(eEventKey.eDBCreate); // don't await, allow this to continue asynchronously
                return this.logSuccess('create', retry);
            } else if (retry < DB_OPERATION_RETRIES)
                await H.Helpers.sleep(DB_OPERATION_RETRY_DELAY);
        }
        return false;
    }
    async update(): Promise<boolean> {
        for (let retry = 1; retry <= DB_OPERATION_RETRIES; retry++) {
            if (await this.updateWorker()) /* istanbul ignore else */ {
                this.updateCachedValues();
                this.audit(eEventKey.eDBUpdate); // don't await, allow this to continue asynchronously
                return this.logSuccess('update', retry);
            } else if (retry < DB_OPERATION_RETRIES)
                await H.Helpers.sleep(DB_OPERATION_RETRY_DELAY);
        }
        return false;
    }
    async delete(): Promise<boolean> {
        for (let retry = 1; retry <= DB_OPERATION_RETRIES; retry++) {
            if (await this.deleteWorker()) /* istanbul ignore else */ {
                this.audit(eEventKey.eDBDelete); // don't await, allow this to continue asynchronously
                return this.logSuccess('delete', retry);
            } else if (retry < DB_OPERATION_RETRIES)
                await H.Helpers.sleep(DB_OPERATION_RETRY_DELAY);
        }
        return false;
    }

    static async createMany<T>(data: DBObject<T>[]): Promise<boolean> {
        for (let retry = 1; retry <= DB_OPERATION_RETRIES; retry++) {
            if (await this.createManyWorker<T>(data)) /* istanbul ignore else */ {
                for (const dataItem of data)
                    dataItem.audit(eEventKey.eDBDelete); // don't await, allow this to continue asynchronously
                return true;
            } else if (retry < DB_OPERATION_RETRIES)
                await H.Helpers.sleep(DB_OPERATION_RETRY_DELAY);
        }
        return false;
    }

    protected logError(method: string, error?: any): boolean { // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
        const errorMessage: string = (H.Helpers.safeString(error?.message) ?? '').replace(/(\n|\r)/g, ' ');
        LOG.error(`DBAPI.${this.fetchTableName()}.${method} ${H.Helpers.JSONStringify(this)}: ${errorMessage}`, LOG.LS.eDB);
        return false;
    }

    private logSuccess(method: string, retry: number): boolean {
        if (retry > 1)
            LOG.info(`DBAPI.${this.fetchTableName()}.${method} ${H.Helpers.JSONStringify(this)} succeeded on retry ${retry}`, LOG.LS.eDB);
        return true;
    }
}

export function CopyArray<B, T>(inputArray: B[] | null, type: { new(inputObj: B): T ;}): T[] | null {
    if (!inputArray)
        return null;
    const outputArray: T[] = [];
    for (const inputObj of inputArray)
        outputArray.push(new type(inputObj));
    return outputArray;
}

export function CopyObject<B, T>(input: B | null, type: { new(inputObj: B): T ;}): T | null {
    if (!input)
        return null;
    return new type(input);
}
