export abstract class DBObject<T> {
    data!: T;
    abstract async create(): Promise<boolean>;
    abstract async update(): Promise<boolean>;
    constructor(input: T) {
        Object.assign(this, input);
    }
}