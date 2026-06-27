/* eslint-disable no-console */

// One-shot data-fix utility for CaptureDataPhoto.CaptureDatasetUse.
//
// The literal '[207,208,209]' was historically baked into the client and
// several server callers as the "default" set of Alignment / Reconstruction /
// TextureGeneration vocabulary IDs. Those numeric IDs are environment-specific
// (they shift with each vocab insertion), so any DB that was seeded against a
// different fresh-build than production will hold stale references.
//
// This script resolves the current idVocabulary values for those three terms
// via the VocabularyCache, scans every CaptureDataPhoto row, and rewrites any
// row whose CaptureDatasetUse exactly matches a known-legacy literal. Rows
// holding any other configuration (a custom user selection, an already-valid
// set, or unrelated values) are left untouched.
//
// Usage:
//   ts-node server/utils/migration/fixCaptureDatasetUse.ts            # dry-run
//   ts-node server/utils/migration/fixCaptureDatasetUse.ts --apply    # write

import * as CACHE from '../../cache';
import { CaptureDataPhoto } from '../../db/api/CaptureDataPhoto';
import * as DBC from '../../db/connection';

// Legacy literals that have appeared in this codebase or in deployed databases
// as the "default" Alignment/Reconstruction/TextureGeneration triple.
const LEGACY_LITERALS: string[] = [
    '[207,208,209]',
    '[209,210,211]',
];

function normalizeJSONArray(raw: string | null | undefined): string | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return null;
        const nums = parsed.filter((n): n is number => typeof n === 'number');
        if (nums.length === 0) return null;
        nums.sort((a, b) => a - b);
        return JSON.stringify(nums);
    } catch {
        return null;
    }
}

async function main(): Promise<number> {
    const apply: boolean = process.argv.includes('--apply');

    const target: string = await CACHE.VocabularyCache.defaultCaptureDatasetUseJSON();
    const legacySet: Set<string> = new Set(LEGACY_LITERALS);
    legacySet.delete(target);

    console.log(`Target CaptureDatasetUse JSON (current vocab):  ${target}`);
    console.log(`Legacy literals to be rewritten:                ${[...legacySet].join(', ') || '(none)'}`);
    console.log(`Mode:                                           ${apply ? 'APPLY' : 'DRY-RUN'}`);

    const rows: CaptureDataPhoto[] | null = await CaptureDataPhoto.fetchAll();
    if (!rows) {
        console.error('Failed to fetch CaptureDataPhoto rows.');
        return 1;
    }
    console.log(`Scanned ${rows.length} CaptureDataPhoto rows.`);

    let matched: number = 0;
    let updated: number = 0;
    let skippedAlreadyCurrent: number = 0;
    let skippedUnrelated: number = 0;

    for (const row of rows) {
        const normalized: string | null = normalizeJSONArray(row.CaptureDatasetUse);
        if (normalized === target) {
            skippedAlreadyCurrent++;
            continue;
        }
        if (!normalized || !legacySet.has(normalized)) {
            skippedUnrelated++;
            continue;
        }
        matched++;
        console.log(`  row idCaptureDataPhoto=${row.idCaptureDataPhoto}: ${row.CaptureDatasetUse} -> ${target}`);
        if (!apply) continue;

        row.CaptureDatasetUse = target;
        const ok: boolean = await row.update();
        if (ok) updated++;
        else console.error(`    update FAILED for idCaptureDataPhoto=${row.idCaptureDataPhoto}`);
    }

    console.log('---');
    console.log(`Matched (legacy literal):         ${matched}`);
    console.log(`Updated:                          ${updated}`);
    console.log(`Already current (skipped):        ${skippedAlreadyCurrent}`);
    console.log(`Unrelated value (skipped):        ${skippedUnrelated}`);
    if (!apply && matched > 0)
        console.log('Re-run with --apply to write these changes.');

    await DBC.DBConnection.disconnect();
    return 0;
}

main()
    .then((code) => process.exit(code))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
