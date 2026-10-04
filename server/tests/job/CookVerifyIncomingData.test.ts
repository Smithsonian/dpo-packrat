/* eslint-disable @typescript-eslint/no-explicit-any */
import { JobCookSIGenerateDownloads } from '../../job/impl/Cook/JobCookSIGenerateDownloads';
import * as DBAPI from '../../db';
import * as COMMON from '@dpo-packrat/common';
import { expectLogErrors } from '../logGate';

// Hermetic coverage for the Cook-output validation gate that guards the
// post-Cook persist/OCFL-write path (TR-12). verifyIncomingCookData decides
// whether a si-generate-downloads Cook response is complete and consistent
// before its files are ingested; a regression here would let a bad/renamed
// download set through (or reject a good one) — a migration-parity risk.
//
// The method is exercised on a bare prototype instance with the few fields it
// touches stubbed; the one DB call (Asset.fetchFromScene) is mocked. Download
// suffixes come from the same @dpo-packrat/common source the method uses, so the
// fixtures never drift from the contract.

const SUFFIXES: string[] = COMMON.cookDownloadSuffixes('full');
const BASE = 'nmnh_sea_turtle-1';

function fileMapFrom(names: string[]): Map<string, string> {
    return new Map(names.map((n, i) => [String(i), n]));
}

// A complete Cook download set: one file per known suffix, plus the scene descriptor.
function validDownloadNames(base: string = BASE): string[] {
    return [...SUFFIXES.map(s => base + s), base + '.svx.json'];
}

function makeJob(): any {
    const jc: any = Object.create(JobCookSIGenerateDownloads.prototype);
    jc.name = () => 'si-generate-downloads';
    jc._dbJobRun = { idJobRun: 1 };
    jc.appendToReportAndLog = jest.fn(async () => ({ success: true }));
    return jc;
}

const scene: any = { idScene: 1, fetchLogInfo: () => ({ idScene: 1 }) };

describe('JobCookSIGenerateDownloads.verifyIncomingCookData — Cook output validation', () => {
    let assetSpy: jest.SpyInstance;
    afterEach(() => { assetSpy?.mockRestore(); jest.restoreAllMocks(); });

    test('accepts a complete, consistent Cook download set', async () => {
        assetSpy = jest.spyOn(DBAPI.Asset, 'fetchFromScene').mockResolvedValue([{ FileName: BASE + SUFFIXES[0] } as any]);
        const r = await makeJob().verifyIncomingCookData(scene, fileMapFrom(validDownloadNames()));
        expect(r.success).toBe(true);
    });

    test('rejects when an expected download suffix is missing', async () => {
        expectLogErrors('Job.GenerateDownloads');
        assetSpy = jest.spyOn(DBAPI.Asset, 'fetchFromScene').mockResolvedValue([{ FileName: BASE + SUFFIXES[0] } as any]);
        const names = validDownloadNames().filter(n => !n.endsWith(SUFFIXES[0]));   // drop one required download
        const r = await makeJob().verifyIncomingCookData(scene, fileMapFrom(names));
        expect(r.success).toBe(false);
    });

    test('rejects an unexpected extra file in the Cook response', async () => {
        expectLogErrors('Job.GenerateDownloads');
        assetSpy = jest.spyOn(DBAPI.Asset, 'fetchFromScene').mockResolvedValue([{ FileName: BASE + SUFFIXES[0] } as any]);
        const names = [...validDownloadNames(), BASE + '.unexpected'];
        const r = await makeJob().verifyIncomingCookData(scene, fileMapFrom(names));
        expect(r.success).toBe(false);
    });

    test('rejects when the scene has no assets to reconcile against', async () => {
        expectLogErrors('Job.GenerateDownloads');
        assetSpy = jest.spyOn(DBAPI.Asset, 'fetchFromScene').mockResolvedValue([]);
        const r = await makeJob().verifyIncomingCookData(scene, fileMapFrom(validDownloadNames()));
        expect(r.success).toBe(false);
    });

    test('rejects a download whose basename differs from an existing same-suffix asset', async () => {
        expectLogErrors('Job.GenerateDownloads');
        // an existing scene asset shares SUFFIXES[0] but under a different basename;
        // re-running Cook would orphan it, so the response must be rejected.
        assetSpy = jest.spyOn(DBAPI.Asset, 'fetchFromScene').mockResolvedValue([{ FileName: 'different_base' + SUFFIXES[0] } as any]);
        const r = await makeJob().verifyIncomingCookData(scene, fileMapFrom(validDownloadNames()));
        expect(r.success).toBe(false);
    });
});
