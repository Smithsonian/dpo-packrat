/* eslint-disable @typescript-eslint/no-explicit-any */
import { NavigationSolr } from '../../../navigation/impl/NavigationSolr/NavigationSolr';
import { NavigationFilter, MetadataFilter } from '../../../navigation/interface';
import * as COMMON from '@dpo-packrat/common';
import { expectLogErrors } from '../../logGate';

// Hermetic coverage for the Solr-backed search path (TR-14). The solr-client
// Query builds offline; only Client.search() reaches the network, so mocking it
// exercises (a) the query the resolver constructs for each filter dimension, and
// (b) the parsing of a Solr response into navigation/metadata entries — with no
// live Solr. IndexSolr doc-shape is a follow-up (its full ObjectGraph walk needs
// DB-graph fixtures).

const DEFAULT_FILTER: NavigationFilter = {
    idRoots: [],
    objectTypes: [],
    metadataColumns: [],
    search: '',
    objectsToDisplay: [],
    units: [],
    projects: [],
    has: [],
    missing: [],
    captureMethod: [],
    variantType: [],
    modelPurpose: [],
    modelFileType: [],
    dateCreatedFrom: null,
    dateCreatedTo: null,
    rows: 100,
    cursorMark: ''
};

// Empty Solr response used when only the outgoing query is under test.
const emptyResponse = (): any => ({ response: { numFound: 0, start: 0, docs: [] }, nextCursorMark: undefined });

describe('NavigationSolr: nav query construction', () => {
    let nav: NavigationSolr;
    let captured: string;

    beforeEach(() => {
        nav = new NavigationSolr();
        captured = '';
        jest.spyOn((nav as any)._solrClientPackrat._client, 'search').mockImplementation(async (SQ: any) => {
            captured = SQ.build();
            return emptyResponse();
        });
    });
    afterEach(() => jest.restoreAllMocks());

    // Solr encodes the built query; decode so assertions read as the intended query.
    async function queryFor(overrides: Partial<NavigationFilter>): Promise<string> {
        await nav.getObjectChildren({ ...DEFAULT_FILTER, ...overrides });
        return decodeURIComponent(captured);
    }

    test('root query hides retired, defaults to Units, uses offset pagination', async () => {
        const q = await queryFor({});
        expect(q).toContain('q=*:*');
        expect(q).toContain('CommonRetired:0');
        expect(q).toContain('CommonObjectType:"Unit"');
        expect(q).toContain('sort=CommonOTNumber asc');
        expect(q).toContain('start=0');
    });

    test('showRetired includes retired objects (no CommonRetired filter)', async () => {
        const q = await queryFor({ showRetired: true });
        expect(q).not.toContain('CommonRetired:0');
    });

    test('free-text search boosts identifiers plus general text and sorts by score', async () => {
        const q = await queryFor({ search: 'apollo' });
        expect(q).toContain('q=apollo');
        expect(q).toContain('CommonIdentifier');
        expect(q).toContain('_text_');
        expect(q).toContain('score desc');
    });

    test('partial ARK search wildcards the term and matches identifiers only', async () => {
        const q = await queryFor({ search: 'ark:65665/abc' });
        expect(q).toContain('*ark');
        expect(q).toContain('CommonIdentifier');
        expect(q).not.toContain('_text_');
    });

    test('full ARK search matches identifiers without wildcards', async () => {
        const q = await queryFor({ search: 'http://n2t.net/ark:65665/abc' });
        expect(q).toContain('CommonIdentifier');
        expect(q).not.toContain('_text_');
        expect(q).not.toContain('*ark');
    });

    test('drill-down (idRoots) uses cursor pagination and a parent-id filter', async () => {
        const q = await queryFor({ idRoots: [123] });
        expect(q).toContain('cursorMark');
        expect(q).toContain('HierarchyParentID:123');
        expect(q).not.toContain('start=');
    });

    test('date-created range applies a ChildrenDateCreated range filter', async () => {
        const q = await queryFor({ dateCreatedFrom: new Date('2020-01-01'), dateCreatedTo: new Date('2020-12-31') });
        expect(q).toContain('ChildrenDateCreated');
        expect(q).toContain('2020-01-01');
        expect(q).toContain('2020-12-31');
    });
});

describe('NavigationSolr: nav response parsing', () => {
    let nav: NavigationSolr;
    let response: any;
    let searchSpy: jest.SpyInstance;

    beforeEach(() => {
        nav = new NavigationSolr();
        response = emptyResponse();
        searchSpy = jest.spyOn((nav as any)._solrClientPackrat._client, 'search').mockImplementation(async () => response);
    });
    afterEach(() => jest.restoreAllMocks());

    test('maps Solr docs to navigation entries with object type and retired flags', async () => {
        response = { response: { numFound: 2, start: 0, docs: [
            { id: '100', CommonObjectType: 'Unit', CommonidObject: 5, CommonName: 'Test Unit', CommonRetired: false },
            { id: '101', CommonObjectType: 'Subject', CommonidObject: 7, CommonName: 'Test Subject', CommonRetired: true },
        ] }, nextCursorMark: 'AoE/next' };

        const result = await nav.getObjectChildren(DEFAULT_FILTER);
        expect(result.success).toBe(true);
        expect(result.total).toBe(2);
        expect(result.entries).toHaveLength(2);
        expect(result.entries[0]).toMatchObject({ idSystemObject: 100, name: 'Test Unit', idObject: 5, objectType: COMMON.eSystemObjectType.eUnit, retired: false });
        expect(result.entries[1]).toMatchObject({ idSystemObject: 101, name: 'Test Subject', idObject: 7, objectType: COMMON.eSystemObjectType.eSubject, retired: true });
    });

    test('skips malformed docs missing required fields', async () => {
        expectLogErrors('Navigation.Solr');
        response = { response: { numFound: 2, start: 0, docs: [
            { id: '100', CommonObjectType: 'Unit', CommonidObject: 5, CommonName: 'Good', CommonRetired: false },
            { id: '', CommonObjectType: 'Unit', CommonidObject: 9, CommonName: 'No id', CommonRetired: false },
        ] }, nextCursorMark: undefined };

        const result = await nav.getObjectChildren(DEFAULT_FILTER);
        expect(result.success).toBe(true);
        expect(result.entries).toHaveLength(1);
        expect(result.entries[0].idSystemObject).toBe(100);
    });

    test('returns failure when the Solr search throws', async () => {
        expectLogErrors('Navigation.Solr');
        searchSpy.mockRejectedValueOnce(new Error('connection refused'));

        const result = await nav.getObjectChildren(DEFAULT_FILTER);
        expect(result.success).toBe(false);
        expect(result.entries).toHaveLength(0);
    });
});

describe('NavigationSolr: metadata query', () => {
    let nav: NavigationSolr;
    let captured: string;
    let response: any;

    const META_FILTER: MetadataFilter = { idRoot: 42, forAssetChildren: false, metadataColumns: ['UnitARKPrefix'], rows: 10, cursorMark: '' };

    beforeEach(() => {
        nav = new NavigationSolr();
        captured = '';
        response = emptyResponse();
        jest.spyOn((nav as any)._solrClientMeta._client, 'search').mockImplementation(async (SQ: any) => {
            captured = SQ.build();
            return response;
        });
    });
    afterEach(() => jest.restoreAllMocks());

    test('builds an id-scoped metadata query with _v columns sorted by id desc', async () => {
        await nav.getMetadata(META_FILTER);
        const q = decodeURIComponent(captured);
        expect(q).toContain('q=*:*');
        expect(q).toContain('id:42');
        expect(q).toContain('unitarkprefix_v');
        expect(q).toContain('sort=id desc');
    });

    test('forAssetChildren scopes by idSystemObjectParent', async () => {
        await nav.getMetadata({ ...META_FILTER, forAssetChildren: true });
        const q = decodeURIComponent(captured);
        expect(q).toContain('idSystemObjectParent:42');
    });

    test('maps metadata docs to entries (value column keyed by <Column>_v)', async () => {
        response = { response: { numFound: 1, start: 0, docs: [
            { id: '50', idSystemObjectParent: '42', 'UnitARKPrefix_v': 'ark:65665' },
        ] }, nextCursorMark: undefined };

        const result = await nav.getMetadata(META_FILTER);
        expect(result.success).toBe(true);
        expect(result.entries).toHaveLength(1);
        expect(result.entries[0]).toMatchObject({ idSystemObject: 50, idSystemObjectParent: 42 });
        expect(result.entries[0].metadata).toEqual(['ark:65665']);
    });
});
