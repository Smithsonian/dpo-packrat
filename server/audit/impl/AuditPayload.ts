/**
 * Audit payload shaping helpers.
 *
 * Every DB API write used to emit a full-row serialization to the Audit.Data
 * column. Rows with LongText columns routinely produced 10–100 KB payloads,
 * multiplied across the 50–200 rows an ingest emits, inflating the table
 * without meaningful forensic value.
 *
 * These helpers produce compact alternatives:
 *   - buildDiffPayload(before, after, trackedFields): just the fields that
 *     changed, with their old and new values. Used when the DB API class
 *     has *Orig snapshot coverage for the mutated fields.
 *   - buildCompactSnapshot(row): full-row projection with long strings
 *     replaced by { __omitted: 'LongText', bytes: N } markers.
 *
 * The helpers never throw; pass anything and they return something JSON-safe.
 */

/** Strings above this length become { __omitted } markers in compact snapshots. */
export const DEFAULT_LONGTEXT_THRESHOLD_BYTES = 512;

export type OmittedMarker = { __omitted: 'LongText'; bytes: number };
export type CompactValue = string | number | boolean | null | OmittedMarker;
export type CompactSnapshot = Record<string, CompactValue>;

export type DiffEntry = { before: unknown; after: unknown };
export type DiffPayload = {
    kind: 'diff';
    changed: Record<string, DiffEntry>;
};

export type SnapshotPayload = {
    kind: 'snapshot';
    row: CompactSnapshot;
};

/**
 * Produce a diff payload covering only the fields whose value changed. Fields
 * not listed in `trackedFields` are ignored — the caller is asserting it has
 * *Orig coverage for every field it names.
 */
export function buildDiffPayload(
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    trackedFields: readonly string[],
): DiffPayload {
    const changed: Record<string, DiffEntry> = {};
    for (const field of trackedFields) {
        const a = before?.[field];
        const b = after?.[field];
        if (!valuesEqual(a, b))
            changed[field] = { before: a, after: b };
    }
    return { kind: 'diff', changed };
}

/**
 * Produce a compact single-row snapshot suitable for create / delete audit
 * rows and for updates on classes that lack *Orig coverage. Strings longer
 * than the threshold are replaced with `{ __omitted, bytes }` so downstream
 * consumers know that a large value was present without paying the storage
 * cost of its contents.
 *
 * Non-primitive values (objects, arrays, Dates, Prisma relation proxies) are
 * coerced: Date → ISO string; anything else → omitted with a typeof marker.
 */
export function buildCompactSnapshot(
    row: unknown,
    threshold: number = DEFAULT_LONGTEXT_THRESHOLD_BYTES,
): SnapshotPayload {
    const out: CompactSnapshot = {};
    if (row === null || typeof row !== 'object') return { kind: 'snapshot', row: out };

    for (const [key, raw] of Object.entries(row as Record<string, unknown>)) {
        if (key.startsWith('_') || key.endsWith('Orig')) continue;
        out[key] = projectValue(raw, threshold);
    }
    return { kind: 'snapshot', row: out };
}

function projectValue(raw: unknown, threshold: number): CompactValue {
    if (raw === null || raw === undefined) return null;
    switch (typeof raw) {
        case 'string':
            return raw.length > threshold
                ? { __omitted: 'LongText', bytes: Buffer.byteLength(raw, 'utf8') }
                : raw;
        case 'number':
        case 'boolean':
            return raw;
        case 'object':
            if (raw instanceof Date) return raw.toISOString();
            // Relations / objects / arrays: omit with a marker. Audit rows
            // describe scalar state changes, not the entire relation graph.
            return { __omitted: 'LongText', bytes: 0 };
        default:
            return null;
    }
}

function valuesEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    if (a === null || b === null || a === undefined || b === undefined) return a === b;
    // Fallback structural compare for small objects.
    return JSON.stringify(a) === JSON.stringify(b);
}
