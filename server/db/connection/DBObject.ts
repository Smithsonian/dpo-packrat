import { eDBObjectType, eNonSystemObjectType, ObjectIDAndType, DBObjectNameToType } from '../api/ObjectType';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import { eEventKey } from '../../event/interface/EventEnums';
import { RecordKeeper as RK } from '../../records/recordKeeper';
import * as H from '../../utils/helpers';
import { withAuditTransaction } from '../../audit/withAuditTransaction';

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

    /**
     * Snapshot tracked scalar fields onto sibling `<Field>Orig` properties.
     * Subclasses override `updateCachedValues` and call this with the list of
     * mutable scalar columns whose pre-mutation value should be available for
     * diff-based audit payloads. The audit pipeline reads `*Orig` siblings via
     * AuditPayload.extractTrackedFields after the DB write to emit a compact
     * { changed: { field: { before, after } } } row instead of the full entity.
     *
     * Snapshot only scalars — never relations, arrays, or sub-records. The
     * audit payload shaper coerces non-scalars to omission markers anyway, so
     * tracking them produces no useful diff and inflates the snapshot.
     */
    protected snapshotTrackedFields(fields: readonly string[]): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const self = this as any;
        for (const field of fields)
            self[`${field}Orig`] = self[field];
    }

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
            // Each attempt is its own tx so the business write + buffered
            // audit row commit atomically. withAuditTransaction is idempotent:
            // when an outer wrapper is active, this short-circuits and the
            // outer commit flushes the audit row.
            const ok = await withAuditTransaction(async () => {
                if (!await this.createWorker()) return false;
                this.updateCachedValues();
                await this.audit(eEventKey.eDBCreate);
                return true;
            });
            if (ok) return this.logSuccess('create', retry);
            if (retry < DB_OPERATION_RETRIES)
                await H.Helpers.sleep(DB_OPERATION_RETRY_DELAY);
        }
        return false;
    }
    async update(): Promise<boolean> {
        for (let retry = 1; retry <= DB_OPERATION_RETRIES; retry++) {
            const ok = await withAuditTransaction(async () => {
                if (!await this.updateWorker()) return false;
                // Audit BEFORE updateCachedValues so *Orig still reflects the
                // pre-mutation snapshot for diff-payload shaping. After the
                // audit emits, refresh *Orig so any subsequent update on the
                // same instance compares against the now-persisted state.
                await this.audit(eEventKey.eDBUpdate);
                this.updateCachedValues();
                return true;
            });
            if (ok) return this.logSuccess('update', retry);
            if (retry < DB_OPERATION_RETRIES)
                await H.Helpers.sleep(DB_OPERATION_RETRY_DELAY);
        }
        return false;
    }
    async delete(): Promise<boolean> {
        for (let retry = 1; retry <= DB_OPERATION_RETRIES; retry++) {
            const ok = await withAuditTransaction(async () => {
                if (!await this.deleteWorker()) return false;
                await this.audit(eEventKey.eDBDelete);
                return true;
            });
            if (ok) return this.logSuccess('delete', retry);
            if (retry < DB_OPERATION_RETRIES)
                await H.Helpers.sleep(DB_OPERATION_RETRY_DELAY);
        }
        return false;
    }

    static async createMany<T>(data: DBObject<T>[]): Promise<boolean> {
        for (let retry = 1; retry <= DB_OPERATION_RETRIES; retry++) {
            const ok = await withAuditTransaction(async () => {
                if (!await this.createManyWorker<T>(data)) return false;
                for (const dataItem of data)
                    await dataItem.audit(eEventKey.eDBCreate);
                return true;
            });
            if (ok) return true;
            if (retry < DB_OPERATION_RETRIES)
                await H.Helpers.sleep(DB_OPERATION_RETRY_DELAY);
        }
        return false;
    }

    private logSuccess(method: string, retry: number): boolean {
        if (retry > 1)
            RK.logInfo(RK.LogSection.eDB,`${this.fetchTableName()}.${method}`,`succeeded on retry ${retry}`,{ ...this },'DB.Object');
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
