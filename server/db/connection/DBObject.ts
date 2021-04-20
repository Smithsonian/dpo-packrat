import { eDBObjectType, ObjectIDAndType, DBObjectNameToType } from '../api/ObjectType';
// import { AuditEventGenerator } from '../../audit/interface';
// import { eEventKey } from '../../event/interface/EventEnums';

export abstract class DBObject<T> {
    public abstract fetchTableName(): string;
    public abstract fetchID(): number;

    protected abstract createWorker(): Promise<boolean>;
    protected abstract updateWorker(): Promise<boolean>;
    protected async deleteWorker(): Promise<boolean> { return false; }
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

    async create(): Promise<boolean> {
        const retVal: boolean = await this.createWorker();
        this.updateCachedValues();
        // AuditEventGenerator.auditDBObject(this, this.computeObjectIDAndType(), eEventKey.eDBCreate);
        return retVal;
    }
    async update(): Promise<boolean> {
        const retVal: boolean = await this.updateWorker();
        this.updateCachedValues();
        // AuditEventGenerator.auditDBObject(this, this.computeObjectIDAndType(), eEventKey.eDBUpdate);
        return retVal;
    }
    async delete(): Promise<boolean> {
        const retVal: boolean = await this.deleteWorker();
        // AuditEventGenerator.auditDBObject(this, this.computeObjectIDAndType(), eEventKey.eDBDelete);
        return retVal;
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
