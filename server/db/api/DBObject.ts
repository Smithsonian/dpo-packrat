export abstract class DBObject<T> {
    abstract async create(): Promise<boolean>;
    abstract async update(): Promise<boolean>;
    constructor(input: T) {
        Object.assign(this, input);
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