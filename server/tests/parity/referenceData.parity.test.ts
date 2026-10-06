/* eslint-disable @typescript-eslint/no-explicit-any */
import * as CACHE from '../../cache';
import * as COMMON from '@dpo-packrat/common';
import { parityCheck } from './parityHarness';

// Parity surface: enum-addressable reference-data contracts (TR-15a).
// The eVocabularyID -> Vocabulary and eLicense -> License mappings drive ingest,
// publish flags, Solr facets, and EDAN payloads, and MUST be identical on the
// migrated server. Captured through the caches BY ENUM, which resolve only to
// seed rows — so, unlike a raw fetchAll catalog, these are immune to the
// create-test rows that accumulate in the shared Packrat_test DB (no fresh seed
// required). If an enum ever resolves to a different id/term on R670, ingest and
// publishing silently diverge — exactly what this baseline is here to catch.

function enumNames(e: any): string[] {
    return Object.keys(e).filter(k => isNaN(Number(k))).sort();
}

describe('Parity: reference-data enum contracts', () => {
    test('eVocabularyID -> vocabulary mapping', async () => {
        const contract: any[] = [];
        for (const name of enumNames(COMMON.eVocabularyID)) {
            const v = await CACHE.VocabularyCache.vocabularyByEnum((COMMON.eVocabularyID as any)[name]);
            contract.push({ enum: name, idVocabulary: v?.idVocabulary ?? null, Term: v?.Term ?? null });
        }
        parityCheck('vocabulary-enum-contract', contract);
    });

    test('eLicense -> license mapping', async () => {
        const contract: any[] = [];
        for (const name of enumNames(COMMON.eLicense)) {
            const l = await CACHE.LicenseCache.getLicenseByEnum((COMMON.eLicense as any)[name]);
            contract.push({ enum: name, idLicense: l?.idLicense ?? null, Name: l?.Name ?? null, RestrictLevel: l?.RestrictLevel ?? null });
        }
        parityCheck('license-enum-contract', contract);
    });
});
