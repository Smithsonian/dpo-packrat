/* eslint-disable @typescript-eslint/no-explicit-any */
import { EdanMDMContent, EdanRecord }  from './EdanMDM';

export type CollectionQueryResultRecord = {
    name: string;
    unit: string;
    identifierPublic: string;
    identifierCollection: string;
    raw?: any | undefined;
};

export type CollectionQueryResults = {
    records: CollectionQueryResultRecord[];
    rowCount: number;
    error: string | null;
};

export type CollectionQueryOptions = {
    searchMetadata?: boolean | undefined;    // false is the default, which means we only search edanMDM records; true means we search edanMDM as well as other types of data
    recordType?: string | undefined;         // the EDAN record type (e.g. 'edanmdm', '3d_package'); transformed into query parameter fq[]=type${recordType}
    gatherRaw?: boolean | undefined;         // false is the default, which means we do not gather raw output and place it in the results; true is the reverse
};

export interface ICollection {
    queryCollection(query: string, rows: number, start: number, options: CollectionQueryOptions | null): Promise<CollectionQueryResults | null>;
    createEdanMDM(edanmdm: EdanMDMContent, status: number, publicSearch: boolean): Promise<EdanRecord | null>;

    /** Identifier services */
    /** Pass in a null shoulder to use the system shoulder */
    generateArk(shoulder: string | null, prependNameAuthority: boolean): string;
    extractArkFromUrl(url: string): string | null;
    transformArkIntoUrl(arkId: string): string
    getArkNameMappingAuthority(): string;
    getArkNameAssigningAuthority(): string;
}