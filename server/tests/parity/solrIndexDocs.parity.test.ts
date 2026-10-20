/* eslint-disable @typescript-eslint/no-explicit-any */
import { IndexSolr } from '../../navigation/impl/NavigationSolr/IndexSolr';
import { SolrClient } from '../../navigation/impl/NavigationSolr/SolrClient';
import * as COMMON from '@dpo-packrat/common';
import { ObjectGraphTestSetup } from '../db/composite/ObjectGraph.setup';
import { parityCheck, maskVolatile } from './parityHarness';

// Parity surface: the Solr documents IndexSolr produces.
// We self-seed the canonical object graph (ObjectGraphTestSetup), then run
// IndexSolr.indexObject for one object of each major type. IndexSolr builds its own
// SolrClient internally, so we spy SolrClient.prototype.add/commit to capture the
// emitted docs[] and send NOTHING to a live core.
//
// Two coverages share the one seed + capture:
//   1. A golden baseline locks the whole per-type doc SHAPE (every Common*/Hierarchy*/
//      Children* field), so any dropped/renamed field diffs on the migrated server.
//   2. Targeted per-type assertions pin the field VALUES — object-type name + enum, the
//      Common* scalars, hierarchy-name propagation up each tier, and the vocabulary
//      term mapping — so an indexing regression (wrong field, broken hierarchy walk,
//      bad vocab-id→term lookup) turns red with a readable failure.
// This runs in the parity lane because IndexSolr.indexObject leaves the suite with a
// non-draining afterAll (the lane runs --forceExit); fullIndex over the whole graph
// stays out of scope — a representative seeded graph is the coverage.
//
// Determinism (for the golden baseline): auto-increment ids, the random subject
// identifier, and DateCreated timestamps are canonicalized to placeholders; the
// Hierarchy*/Children* arrays are sets with non-deterministic emit order, so they are
// sorted before capture (the harness only sorts object keys, never array order).

const OHTS: ObjectGraphTestSetup = new ObjectGraphTestSetup();

// Volatile keys in a Solr doc: the primary 'id' (= idSystemObject), CommonidObject
// (the underlying DB id), every *ID hierarchy array, the random CommonIdentifier /
// <Type>IdentifierPreferred value, and any *date* field. CommonOTNumber (the
// object-type enum) and all *Name/term fields are stable and deliberately kept.
const ID_KEYS: RegExp = /(^id$)|(ID$)|(^CommonidObject$)|(^CommonIdentifier$)|(IdentifierPreferred$)/;
const DATE_KEYS: RegExp = /date/i;

// Sort arrays of primitives so set-valued fields capture deterministically; recurse
// objects and arrays of objects untouched in order (none are order-significant here).
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

// Children* fields are emitted as Solr atomic-update objects ({ add: [...] }); unwrap
// to the underlying array so value assertions read them either way.
function addArr(v: any): any[] {
    if (Array.isArray(v)) return v;
    return (v && Array.isArray(v.add)) ? v.add : [];
}

describe('Parity: Solr index document shapes', () => {
    const captured: any[] = [];
    const docs: Record<string, any> = {};
    let addSpy: jest.SpyInstance;
    let commitSpy: jest.SpyInstance;

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

    beforeAll(async () => {
        await OHTS.initialize();
        await OHTS.wire();

        addSpy = jest.spyOn(SolrClient.prototype, 'add').mockImplementation(async (d: any[]) => {
            captured.push(...d);
            return { success: true };
        });
        commitSpy = jest.spyOn(SolrClient.prototype, 'commit').mockResolvedValue({ success: true });

        docs.Unit = await captureDoc(OHTS.idSOUnit1);
        docs.Project = await captureDoc(OHTS.idSOProject1);
        docs.Subject = await captureDoc(OHTS.idSOSubject1);
        docs.Item = await captureDoc(OHTS.idSOItem1);
        docs.CaptureData = await captureDoc(OHTS.idSOCaptureData1);
        docs.Model = await captureDoc((await OHTS.model1!.fetchSystemObject())!.idSystemObject);
        docs.Scene = await captureDoc((await OHTS.scene1!.fetchSystemObject())!.idSystemObject);
    });

    afterAll(() => {
        addSpy.mockRestore();
        commitSpy.mockRestore();
    });

    test('golden baseline: full per-type doc shape', () => {
        parityCheck('solr-index-docs', docs, normalize);
    });

    test('Unit: type/name + abbreviation/ARK prefix + aggregated descendant types', () => {
        const d = docs.Unit;
        expect(d.CommonObjectType).toBe('Unit');
        expect(d.CommonOTNumber).toBe(COMMON.eSystemObjectType.eUnit);
        expect(d.CommonName).toBe('OA Test unit1');
        expect(d.CommonRetired).toBe(false);
        expect(d.UnitAbbreviation).toBe('DPO');
        expect(d.UnitARKPrefix).toBe('http://dpo/');
        expect(d.HierarchyUnit).toEqual(['DPO']);
        expect(addArr(d.ChildrenObjectTypes)).toEqual(expect.arrayContaining(['Subject', 'Item', 'Model', 'Scene', 'Capture Data']));
    });

    test('Project: type/name/description + self in hierarchy', () => {
        const d = docs.Project;
        expect(d.CommonObjectType).toBe('Project');
        expect(d.CommonOTNumber).toBe(COMMON.eSystemObjectType.eProject);
        expect(d.CommonName).toBe('OA Test project1');
        expect(d.CommonDescription).toBe('OA Test');
        expect(d.HierarchyProject).toEqual(['OA Test project1']);
    });

    test('Subject: type/name + identifier present + unit hierarchy', () => {
        const d = docs.Subject;
        expect(d.CommonObjectType).toBe('Subject');
        expect(d.CommonOTNumber).toBe(COMMON.eSystemObjectType.eSubject);
        expect(d.CommonName).toBe('OA Test subject1');
        expect(Array.isArray(d.CommonIdentifier)).toBe(true);
        expect(d.CommonIdentifier.length).toBe(1);
        expect(typeof d.SubjectIdentifierPreferred).toBe('string');
        expect(d.HierarchyUnit).toEqual(['DPO']);
        expect(d.HierarchySubject).toEqual(['OA Test subject1']);
    });

    test('Item: type/name + EntireSubject + full ancestor name chain', () => {
        const d = docs.Item;
        expect(d.CommonObjectType).toBe('Item');
        expect(d.CommonOTNumber).toBe(COMMON.eSystemObjectType.eItem);
        expect(d.CommonName).toBe('OA Test item1');
        expect(d.ItemEntireSubject).toBe(true);
        expect(d.HierarchyUnit).toEqual(['DPO']);
        expect(d.HierarchySubject).toEqual(['OA Test subject1']);
        expect(d.HierarchyProject).toEqual(['OA Test project1']);
        expect(d.HierarchyItem).toEqual(['OA Test item1']);
    });

    test('CaptureData: type/name + capture-method vocab term + ancestor chain', () => {
        const d = docs.CaptureData;
        expect(d.CommonObjectType).toBe('Capture Data');
        expect(d.CommonOTNumber).toBe(COMMON.eSystemObjectType.eCaptureData);
        expect(d.CommonName).toBe('OA Test captureData1');
        expect(d.CDCaptureMethod).toBe('ARK'); // vocabulary id resolves to its term
        expect(d.HierarchyUnit).toEqual(['DPO']);
        expect(d.HierarchyItem).toEqual(['OA Test item1']);
    });

    test('Model: type/name + scalar + vocab-term fields + ancestor chain', () => {
        const d = docs.Model;
        expect(d.CommonObjectType).toBe('Model');
        expect(d.CommonOTNumber).toBe(COMMON.eSystemObjectType.eModel);
        expect(d.CommonName).toBe('OA Test model1');
        expect(d.ModelFileEncoding).toBe('BINARY');
        expect(d.ModelIsDracoCompressed).toBe(false);
        expect(d.ModelCountVertices).toBe(0);
        expect(d.ModelCreationMethod).toBe('ARK');
        expect(d.ModelModality).toBe('ARK');
        expect(d.ModelUnits).toBe('ARK');
        expect(d.ModelPurpose).toBe('ARK');
        expect(d.ModelFileType).toBe('ARK');
        expect(d.HierarchyUnit).toEqual(['DPO']);
        expect(d.HierarchySubject).toEqual(['OA Test subject1']);
        expect(d.HierarchyItem).toEqual(['OA Test item1']);
    });

    test('Scene: type/name + publish flags + counts + ancestor chain', () => {
        const d = docs.Scene;
        expect(d.CommonObjectType).toBe('Scene');
        expect(d.CommonOTNumber).toBe(COMMON.eSystemObjectType.eScene);
        expect(d.CommonName).toBe('OA Test scene1');
        expect(d.SceneApprovedForPublication).toBe(true);
        expect(d.ScenePosedAndQCd).toBe(true);
        expect(d.SceneEdanUUID).toBeNull();
        expect(d.SceneCountCamera).toBe(0);
        expect(d.HierarchyUnit).toEqual(['DPO']);
        expect(d.HierarchySubject).toEqual(['OA Test subject1']);
        expect(d.HierarchyItem).toEqual(['OA Test item1']);
    });
});
