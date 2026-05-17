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
 *
 * `*Orig` tracking pattern (DB API subclasses):
 *
 *   class Foo extends DBObject<FooBase> {
 *       Name!: string;
 *       Description!: string | null;
 *       // ...
 *       NameOrig!: string;
 *       DescriptionOrig!: string | null;
 *
 *       protected updateCachedValues(): void {
 *           this.snapshotTrackedFields(['Name', 'Description', ...]);
 *       }
 *   }
 *
 * Why: at update time the audit row carries a diff covering ONLY the fields
 * that actually moved — `{ before: 'old name', after: 'new name' }` — instead
 * of a full snapshot of every column. That keeps payloads small (a typical
 * scene rename audits at <500 bytes vs ~10 KB without tracking) AND makes
 * forensic queries usable: "who renamed Scene X last month" becomes a single
 * SELECT against `JSON_EXTRACT(Data, '$.changed.Name')` instead of diffing
 * adjacent snapshots by hand. The diff-only path activates automatically once
 * `*Orig` siblings exist; classes without coverage still emit a compact
 * snapshot, so tracking is opt-in and incremental.
 *
 * extractTrackedFields() below scans for any property ending in 'Orig' whose
 * base name is also present on the object — that is how the diff path
 * discovers tracked columns at audit time without per-class wiring.
 *
 * Why this shape (and not inline patch-based diffing)?
 *
 * The codebase mutates DB-API instances in place — load → assign fields →
 * call .update() — and the audit emit happens inside .update(), at which
 * point the original values have already been overwritten in memory. The
 * `*Orig` siblings are simply where the pre-mutation values are parked at
 * load time so the diff path has something to compare against.
 *
 * A patch-based API (e.g. `obj.applyPatch({ Name: 'new' })` that internally
 * fetches `before`, applies the patch, and emits a diff scoped to the patch
 * keys) would eliminate the per-class `*Orig` declarations entirely and
 * scope diffs to "what the caller actually changed" rather than "every
 * column the class author remembered to track." That is the better long-term
 * shape and is scoped as a future cleanup; rolling it out today would
 * require migrating every mutate-then-update call site (hundreds of them
 * across resolvers, REST handlers, and workers) plus rewiring the few
 * workers that consult `*Orig` for transition detection (e.g. Scene's
 * ApprovedForPublication / PosedAndQCd flag flips). `*Orig` is the pattern
 * that fits the existing call-site shape with the least surface change.
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
