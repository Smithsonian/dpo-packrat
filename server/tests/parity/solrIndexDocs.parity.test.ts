/* eslint-disable @typescript-eslint/no-explicit-any */
import { IndexSolr } from '../../navigation/impl/NavigationSolr/IndexSolr';
import { SolrClient } from '../../navigation/impl/NavigationSolr/SolrClient';
import { ObjectGraphTestSetup } from '../db/composite/ObjectGraph.setup';
import { parityCheck, maskVolatile } from './parityHarness';

// Parity surface: the Solr documents IndexSolr produces.
// We self-seed the canonical object graph (ObjectGraphTestSetup),
// then run IndexSolr.indexObject for one object of each major type. IndexSolr builds
// its own SolrClient internally, so we spy SolrClient.prototype.add/commit to capture
// the emitted docs[] and send NOTHING to a live core. The baseline locks the per-type
// doc shape — the Common*/Hierarchy*/Children* fields and their vocab-term mapping —
// that the search index depends on; a field dropped or mis-mapped on the migrated
// server would silently degrade discovery. Shares the seeded-graph fixture
// (which asserts the field VALUES; this surface locks the SHAPE).
//
// Determinism: auto-increment ids, the random subject identifier, and DateCreated
// timestamps are canonicalized to placeholders; the Hierarchy*/Children* arrays are
// sets with non-deterministic emit order, so they are sorted before capture (the
// harness only sorts object keys, never array order).

const OHTS: ObjectGraphTestSetup = new ObjectGraphTestSetup();

// Volatile keys in a Solr doc: the primary 'id' (= idSystemObject), CommonidObject
// (the underlying DB id), every *ID hierarchy array, the random CommonIdentifier /
// <Type>IdentifierPreferred value, and any *date* field. CommonOTNumber (the
// object-type enum) and all *Name/term fields are stable and deliberately kept.
const ID_KEYS: RegExp = /(^id$)|(ID$)|(^CommonidObject$)|(^CommonIdentifier$)|(IdentifierPreferred$)/;
const DATE_KEYS: RegExp = /date/i;

// Sort arrays of primitives so set-valued fields capture deterministically; recurse
// objects and arrays of objects untouched in order (none are order-significant here,
// but masked-id object arrays are not produced by this surface).
function sortArraysDeep(value: any): any {
    if (Array.isArray(value)) {
        const mapped = value.map(sortArraysDeep);
        if (mapped.every(v => v === null || typeof v !== 'object'))
            return [...mapped].sort((a, b) => String(a).localeCompare(String(b)));
        return mapped;
    }
    if (value !== null && typeof value === 'object')
        return Object.keys(value).reduce((acc: Record<string, unknown>, k: string) => {
            acc[k] = sortArraysDeep(value[k]);
            return acc;
        }, {});
    return value;
}

const normalize = (d: any): unknown => sortArraysDeep(maskVolatile(d, { idKeys: ID_KEYS, dateKeys: DATE_KEYS }));

describe('Parity: Solr index document shapes', () => {
    const captured: any[] = [];
    let addSpy: jest.SpyInstance;
    let commitSpy: jest.SpyInstance;

    beforeAll(async () => {
        await OHTS.initialize();
        await OHTS.wire();

        addSpy = jest.spyOn(SolrClient.prototype, 'add').mockImplementation(async (docs: any[]) => {
            captured.push(...docs);
            return { success: true };
        });
        commitSpy = jest.spyOn(SolrClient.prototype, 'commit').mockResolvedValue({ success: true });
    });

    afterAll(() => {
        addSpy.mockRestore();
        commitSpy.mockRestore();
    });

    // Index a single object through a fresh IndexSolr (so its internal object graph is
    // not reused across types) and return the emitted doc whose id matches the target.
    async function captureDoc(idSystemObject: number): Promise<any> {
        expect(idSystemObject).toBeGreaterThan(0);
        captured.length = 0;
        const ok: boolean = await new IndexSolr().indexObject(idSystemObject);
        expect(ok).toBe(true);
        const doc = captured.find(d => d.id === idSystemObject);
        expect(doc).toBeTruthy();
        return doc;
    }

    test('per-type Solr doc shapes', async () => {
        const idSOModel1: number = (await OHTS.model1!.fetchSystemObject())!.idSystemObject;
        const idSOScene1: number = (await OHTS.scene1!.fetchSystemObject())!.idSystemObject;

        const docs: Record<string, any> = {
            Unit: await captureDoc(OHTS.idSOUnit1),
            Project: await captureDoc(OHTS.idSOProject1),
            Subject: await captureDoc(OHTS.idSOSubject1),
            Item: await captureDoc(OHTS.idSOItem1),
            CaptureData: await captureDoc(OHTS.idSOCaptureData1),
            Model: await captureDoc(idSOModel1),
            Scene: await captureDoc(idSOScene1),
        };

        parityCheck('solr-index-docs', docs, normalize);
    });
});
