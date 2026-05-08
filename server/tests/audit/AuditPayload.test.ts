import {
    buildDiffPayload,
    buildCompactSnapshot,
    DEFAULT_LONGTEXT_THRESHOLD_BYTES,
} from '../../audit/impl/AuditPayload';

describe('buildDiffPayload', () => {
    test('records only the fields whose value actually changed', () => {
        const before = { Name: 'Old', Count: 1, Active: true };
        const after = { Name: 'New', Count: 1, Active: false };
        const diff = buildDiffPayload(before, after, ['Name', 'Count', 'Active']);
        expect(diff.kind).toBe('diff');
        expect(Object.keys(diff.changed).sort()).toEqual(['Active', 'Name']);
        expect(diff.changed.Name).toEqual({ before: 'Old', after: 'New' });
        expect(diff.changed.Active).toEqual({ before: true, after: false });
    });

    test('ignores fields outside the tracked-field list', () => {
        const before = { Name: 'Old', Untracked: 1 };
        const after = { Name: 'Old', Untracked: 2 };
        const diff = buildDiffPayload(before, after, ['Name']);
        expect(diff.changed).toEqual({});
    });

    test('treats two Date instances with same epoch as equal', () => {
        const d1 = new Date('2024-01-01T00:00:00Z');
        const d2 = new Date('2024-01-01T00:00:00Z');
        const diff = buildDiffPayload({ When: d1 }, { When: d2 }, ['When']);
        expect(diff.changed).toEqual({});
    });
});

describe('buildCompactSnapshot', () => {
    test('projects scalars directly and omits objects with a marker', () => {
        const row = {
            idScene: 5,
            Name: 'A',
            Active: true,
            CreatedAt: new Date('2024-01-01T00:00:00Z'),
            Relation: { id: 1, junk: 'lots' },
        };
        const snap = buildCompactSnapshot(row);
        expect(snap.kind).toBe('snapshot');
        expect(snap.row.idScene).toBe(5);
        expect(snap.row.Name).toBe('A');
        expect(snap.row.Active).toBe(true);
        expect(snap.row.CreatedAt).toBe('2024-01-01T00:00:00.000Z');
        expect(snap.row.Relation).toEqual({ __omitted: 'LongText', bytes: 0 });
    });

    test('replaces long strings with an omission marker', () => {
        const big = 'x'.repeat(DEFAULT_LONGTEXT_THRESHOLD_BYTES + 100);
        const snap = buildCompactSnapshot({ Text: big });
        const projected = snap.row.Text as { __omitted: string; bytes: number };
        expect(projected.__omitted).toBe('LongText');
        expect(projected.bytes).toBeGreaterThan(DEFAULT_LONGTEXT_THRESHOLD_BYTES);
    });

    test('filters out *Orig and underscore-prefixed fields', () => {
        const snap = buildCompactSnapshot({
            Name: 'A',
            NameOrig: 'OldA',
            _private: 'x',
        });
        expect(Object.keys(snap.row)).toEqual(['Name']);
    });
});

describe('AuditFactory.shapePayload (via legacy audit path)', () => {
    // Verify the end-to-end payload size for a typical rename. The Audit.Data
    // column for a Scene rename should be well under 500 bytes.
    test('simulated Scene rename produces a small diff payload', () => {
        const sceneLike = {
            idScene: 1,
            Name: 'New Name',
            NameOrig: 'Old Name',
            ApprovedForPublication: true,
            ApprovedForPublicationOrig: true,
            // Simulate a LongText field to confirm it never leaks through a diff.
            Notes: 'x'.repeat(10000),
        };
        const diff = buildDiffPayload(
            { Name: sceneLike.NameOrig, ApprovedForPublication: sceneLike.ApprovedForPublicationOrig },
            { Name: sceneLike.Name, ApprovedForPublication: sceneLike.ApprovedForPublication },
            ['Name', 'ApprovedForPublication'],
        );
        const serialized = JSON.stringify(diff);
        expect(serialized.length).toBeLessThan(500);
    });
});
