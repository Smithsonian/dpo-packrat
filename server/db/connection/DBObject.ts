export abstract class DBObject<T> {
    protected abstract createWorker(): Promise<boolean>;
    protected abstract updateWorker(): Promise<boolean>;
    protected updateCachedValues(): void { }

    constructor(input: T) {
        Object.assign(this, input);
        this.updateCachedValues();
    }

    async create(): Promise<boolean> {
        const retVal: boolean = await this.createWorker();
        this.updateCachedValues();
        return retVal;
    }
    async update(): Promise<boolean> {
        const retVal: boolean = await this.updateWorker();
        this.updateCachedValues();
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