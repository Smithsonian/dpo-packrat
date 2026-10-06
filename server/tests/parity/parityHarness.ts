import * as fs from 'fs';
import * as path from 'path';

// Golden-record parity harness (TR-15a). The migration cutover gate: capture the
// CURRENT server's deterministic outputs as committed baselines, then re-run on the
// new server (R670, TR-15b) and diff. A byte/structural divergence fails the gate.
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
