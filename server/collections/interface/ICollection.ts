/* eslint-disable @typescript-eslint/no-explicit-any */
export type CollectionQueryResultRecord = {
    name: string;
    unit: string;
    identifierPublic: string;
    identifierCollection: string;
};

export type CollectionQueryResults = {
    records: CollectionQueryResultRecord[];
    rowCount: number;
    error: string | null;
};

export interface ICollection {
    queryCollection(query: string, rows: number, start: number, options: any): Promise<CollectionQueryResults | null>;

    /** Identifier services */
    /** Pass in a null shoulder to use the system shoulder */
    generateArk(shoulder: string | null, prependNameAuthority: boolean): string;
    extractArkFromUrl(url: string): string | null;
    transformArkIntoUrl(arkId: string): string
    getArkNameMappingAuthority(): string;
    getArkNameAssigningAuthority(): string;
}