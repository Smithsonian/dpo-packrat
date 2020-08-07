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
    queryCollection(query: string, rows: number, start: number): Promise<CollectionQueryResults | null>;
}