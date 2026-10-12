import * as fs from 'fs';
import * as path from 'path';

// Golden-record parity harness. The migration cutover gate: capture the CURRENT
// server's deterministic outputs as committed baselines, then re-run on the new
// server and diff. A byte/structural divergence fails the gate.
//
// Workflow:
//   yarn test:parity:bless   (current server) -> writes tests/parity/baselines/*.json
//   git add tests/parity/baselines && commit
//   yarn test:parity         (any server)     -> asserts current output == baseline
//
// Surfaces must be DETERMINISTIC: the same frozen seed must produce identical output
// on re-run. Reference-data catalogs (vocabulary, license) are inherently stable
// (seed-derived, no dates/uuids). Heavier surfaces (OCFL manifests, download
// packages, EDAN payloads, GraphQL responses, Solr docs) carry ids/dates/paths and
// must pass a `normalize` step (below) that strips or canonicalizes those before
// baselining, so parity reflects behavior — not incidental identifiers.

export const BLESS_MODE: boolean = process.env.PACKRAT_PARITY_BLESS === '1';

const BASELINE_DIR: string = path.join(__dirname, 'baselines');

// Deterministic serialization: recursively sort object keys so key order can never
// churn a diff. Arrays keep their order (callers sort meaningfully before capture).
function sortKeys(value: unknown): unknown {
    if (Array.isArray(value))
        return value.map(sortKeys);
    if (value !== null && typeof value === 'object')
        return Object.keys(value as Record<string, unknown>).sort().reduce((acc: Record<string, unknown>, k: string) => {
            acc[k] = sortKeys((value as Record<string, unknown>)[k]);
            return acc;
        }, {});
    return value;
}

export function stableStringify(data: unknown): string {
    return JSON.stringify(sortKeys(data), null, 2);
}

/**
 * Capture (bless mode) or assert (gate mode) a parity surface.
 * @param name       baseline filename (without extension), kebab-case
 * @param data       the surface data; must be deterministic across runs
 * @param normalize  optional canonicalizer applied before serialization — strip or
 *                   fix volatile fields (auto-increment ids, dates, uuids, absolute
 *                   paths) so parity reflects behavior, not incidental identifiers.
 */
export function parityCheck(name: string, data: unknown, normalize?: (d: any) => unknown): void {
    const shaped: unknown = normalize ? normalize(data) : data;
    const serialized: string = stableStringify(shaped);
    const file: string = path.join(BASELINE_DIR, `${name}.json`);

    if (BLESS_MODE) {
        fs.mkdirSync(BASELINE_DIR, { recursive: true });
        fs.writeFileSync(file, serialized + '\n', 'utf8');
        // Sanity + satisfies the assertion-count gate during a bless run.
        expect(serialized.length).toBeGreaterThan(0);
        return;
    }

    if (!fs.existsSync(file))
        throw new Error(`[parity] no baseline for '${name}'. Run 'yarn test:parity:bless' on the current server and commit tests/parity/baselines/.`);

    const expected: string = fs.readFileSync(file, 'utf8').trim();
    // Equality of the canonical serialization IS the parity assertion.
    expect(serialized).toEqual(expected);
}

// Stable placeholders for canonicalized volatile fields. A masked field keeps its
// key and its container's shape (array length, null-vs-value) — only the volatile
// value is replaced, so a dropped/renamed field still surfaces as a diff.
export const ID_PLACEHOLDER: string = '<id>';
export const DATE_PLACEHOLDER: string = '<date>';
export const UUID_PLACEHOLDER: string = '<uuid>';
export const PATH_PLACEHOLDER: string = '<path>';

const ISO_DATE_RE: RegExp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/;
const UUID_RE: RegExp = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export interface MaskOptions {
    idKeys?: RegExp;    // keys whose value (scalar or array-of-scalar) is a volatile auto-increment id
    dateKeys?: RegExp;  // keys whose value is a volatile timestamp
    pathKeys?: RegExp;  // keys whose string value is a volatile absolute path / url / storage hash
    keepKeys?: RegExp;  // keys to leave untouched even if they match one of the sets above
}

// Replace a keyed volatile value with its placeholder while preserving container
// shape: null/undefined pass through (the null-vs-value distinction is meaningful)
// and array length is kept (scalars -> placeholder, nested objects -> recursed). A
// scalar OR a non-array object (e.g. a Date) collapses straight to the placeholder —
// a volatile field is volatile whatever its runtime type.
function maskKeyed(value: any, placeholder: string, walk: (v: any, k?: string) => any): any {
    if (value === null || value === undefined)
        return value;
    if (Array.isArray(value))
        return value.map(v => (v !== null && typeof v === 'object') ? walk(v) : (v === null ? null : placeholder));
    return placeholder;
}

/**
 * Canonicalize volatile fields (auto-increment ids, timestamps, uuids, absolute
 * paths/hashes) to stable placeholders so a parity baseline reflects behavior, not
 * incidental identifiers that legitimately differ across servers. Key-matched masks
 * run first (idKeys/dateKeys/pathKeys, unless keepKeys exempts the key); any
 * remaining string value that itself looks like an ISO timestamp or a uuid is
 * canonicalized by value. Use as the `normalize` hook passed to parityCheck.
 */
export function maskVolatile(data: unknown, opts: MaskOptions = {}): unknown {
    const walk = (value: any, key?: string): any => {
        if (key !== undefined && !(opts.keepKeys && opts.keepKeys.test(key))) {
            if (opts.idKeys && opts.idKeys.test(key))
                return maskKeyed(value, ID_PLACEHOLDER, walk);
            if (opts.dateKeys && opts.dateKeys.test(key))
                return maskKeyed(value, DATE_PLACEHOLDER, walk);
            if (opts.pathKeys && opts.pathKeys.test(key))
                return maskKeyed(value, PATH_PLACEHOLDER, walk);
        }
        if (Array.isArray(value))
            return value.map(v => walk(v));
        if (value !== null && typeof value === 'object')
            return Object.keys(value).reduce((acc: Record<string, unknown>, k: string) => {
                acc[k] = walk(value[k], k);
                return acc;
            }, {});
        if (typeof value === 'string') {
            if (ISO_DATE_RE.test(value))
                return DATE_PLACEHOLDER;
            if (UUID_RE.test(value))
                return UUID_PLACEHOLDER;
        }
        return value;
    };
    return walk(data);
}
