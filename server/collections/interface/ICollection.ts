/* eslint-disable @typescript-eslint/no-explicit-any */
import { EdanMDMContent, Edan3DPackageContent, EdanRecord }  from './EdanSchemas';

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
    error?: string | null;
};

export type CollectionQueryOptions = {
    searchMetadata?: boolean | undefined;    // false is the default, which means we only search edanMDM records; true means we search edanMDM as well as other types of data
    recordType?: string | undefined;         // the EDAN record type (e.g. 'edanmdm', '3d_package'); transformed into query parameter fq[]=type${recordType}
    gatherRaw?: boolean | undefined;         // false is the default, which means we do not gather raw output and place it in the results; true is the reverse
};

/**
 * For the APIs below:
 * status: 0 means published; 1 means unpublished
 * publicSearch: true means searchable on EDAN, false means otherwise
 *
 * To create a 3D Package (a published scene), the following steps are needed
 * 1. Ensure the scene has a UUID.  If not, create it and persist it to the scene
 * 2. Gather the files representing the scene into a zip (named $$UUID$$.zip).
 *    Ensure the svx.json descriptor is in the root of the zip, and rebase the other
 *    files relative to that root.
 * 3. Stage the zip in Config.collection.edan.stagingRoot
 * 4. Use createEdan3DPackage, passing in the "shared name" representing the zip file
 *    in a location that can be read by the EDAN server (an NFS share).  Pass in the
 *    sceneFile name if it's not 'scene.svx.json'.
 *
 * If the scene has downloads:
 * 5. Stage the scene downloads in Config.collection.edan.resourcesHotFolder
 * 6. Construct sceneContent: Edan3DPackageContent with the contents of the scene.svx.json as
 *    the document, and an array of Edan3DResource objects, one per download.
 * 7. Use updateEdan3DPackage. The url comes from the returned EdanRecord from createEdan3DPackage;
 *    pass in the sceneContent constructed above.
 */
export interface ICollection {
    queryCollection(query: string, rows: number, start: number, options: CollectionQueryOptions | null): Promise<CollectionQueryResults | null>;
    publish(idSystemObject: number, ePublishState: number): Promise<boolean>;
    createEdanMDM(edanmdm: EdanMDMContent, status: number, publicSearch: boolean): Promise<EdanRecord | null>;
    createEdan3DPackage(path: string, sceneFile?: string | undefined): Promise<EdanRecord | null>;
    updateEdan3DPackage(url: string, title: string | undefined, sceneContent: Edan3DPackageContent,
        status: number, publicSearch: boolean): Promise<EdanRecord | null>;

    /** Identifier services */
    /** Pass in a null shoulder to use the system shoulder */
    generateArk(shoulder: string | null, prependNameAuthority: boolean): string;
    extractArkFromUrl(url: string): string | null;
    transformArkIntoUrl(arkId: string): string
    getArkNameMappingAuthority(): string;
    getArkNameAssigningAuthority(): string;
}