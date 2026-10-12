/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import * as path from 'path';
import * as DBAPI from '../../db';
import * as STORE from '../../storage/interface';
import * as CACHE from '../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as UTIL from '../db/api';
import { JobCookSIGenerateDownloadsOutput } from '../../job/impl/Cook/JobCookSIGenerateDownloads';
import { parityCheck } from './parityHarness';

// Parity surfaces: the OCFL inventory.json, the download-package manifest, and the
// Cook replay parse (extractDownloads). These are the storage-serialization contracts
// at HIGHEST migration risk — path/OS/toolchain-sensitive layout and digests the old
// server can never regenerate once it changes.
//
// We drive the REAL write path: STORE.AssetStorageAdapter.ingestStreamOrFile ingests
// committed fixture files (the model-package derivatives) into the sandbox OCFL store
// (var/test, pinned by setEnvVars) — never real storage, no Cook/EDAN contact. From
// the result we capture:
//   - download-package-manifest: per-entry { FileName, StorageSize, StorageHash } —
//     KEEP all three (the sha512 of fixed bytes is deterministic across servers).
//   - ocfl-inventory-manifest: the inventory.json for one ingested asset — KEEP the
//     digests + content/state file map + digestAlgorithm/head/type; canonicalize the
//     volatile object id, created timestamps, and committer.
//   - cook-download-map: extractDownloads() over an authored Cook JobRun.Output,
//     locking the downloadType->filename parse.
//
// Scope: this locks the shared serialization only. The full createSystemObjects
// persist orchestration (new SystemObjectVersion clone, MSX/SOV-AV xref wiring,
// scene-file ingest) is a separate behavioral surface and is not exercised here.

const SANDBOX_COMMENT: string = 'parity fixture ingest';
const FIXTURE_DIR: string = path.resolve(__dirname, '..', 'mock', 'parity', 'model-package');
// Deterministic order; sha512 of each is fixed by the committed bytes.
const FIXTURE_FILES: string[] = ['Box_Test_Txr.png', 'Model_Test.mtl', 'Model_Test.obj'];

// An authored Cook si-generate-downloads report: only the subtree extractDownloads
// reads (steps.delivery.result.files), mapping each validDownloadType to its filename.
const COOK_OUTPUT: any = {
    steps: { delivery: { result: { files: {
        objZipFull: 'DPO_Testing-full_resolution-obj_std.zip',
        objZipLow: 'DPO_Testing-150k-4096-obj_std.zip',
        gltfZipLow: 'DPO_Testing-150k-4096-gltf_std.zip',
        usdz: 'DPO_Testing-100k-2048_std.usdz',
        webAssetGlbARCompressed: 'DPO_Testing-100k-2048_std_draco.glb',
        webAssetGlbLowUncompressed: 'DPO_Testing-150k-4096_std.glb',
        scene_document: 'DPO_Testing.svx.json',
    } } } },
};

// The OCFL digest->paths maps (manifest, version state) are keyed by content hash. We
// invert each to { logicalPath: digest } so the STABLE content path is the key and the
// digest is asserted as its value. Two values are canonicalized: the path separator
// (Packrat emits OS-native '\' on Windows; R670 is POSIX) so the baseline is portable,
// and the digest of Packrat's own `0=metadata.json` sidecar — that file embeds the
// asset's ids/dates, so its hash legitimately differs every run. Real content digests
// (e.g. Model_Test.obj) are kept verbatim: proving they reproduce byte-identically is
// the whole point of this surface.
function canonicalizeDigestMap(m: Record<string, string[]>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [digest, paths] of Object.entries(m))
        for (const p of paths) {
            const key: string = p.replace(/\\/g, '/');
            out[key] = /metadata\.json$/.test(key) ? '<volatile-digest>' : digest;
        }
    return out;
}

function normalizeInventory(inv: any): unknown {
    const out: any = JSON.parse(JSON.stringify(inv));
    out.id = '<id>';                                            // object id carries the random storage key
    if (out.manifest)
        out.manifest = canonicalizeDigestMap(out.manifest);
    for (const v of Object.values(out.versions ?? {}) as any[]) {
        if (v.created !== undefined) v.created = '<date>';
        if (v.user !== undefined) v.user = { address: '<redacted>', name: '<redacted>' };
        if (v.state) v.state = canonicalizeDigestMap(v.state);
    }
    return out;
}

describe('Parity: OCFL inventory + download-package manifest', () => {
    let owner: DBAPI.Model;
    let idUser: number;
    let idVAssetType: number;

    beforeAll(async () => {
        const user: DBAPI.User = await UTIL.createUserTest({
            Name: 'Parity Ingest User', EmailAddress: 'parity-ingest@si.edu', SecurityID: 'PARITY',
            Active: true, DateActivated: UTIL.nowCleansed(), DateDisabled: null,
            WorkflowNotificationTime: UTIL.nowCleansed(), EmailSettings: 0, idUser: 0, SlackID: '',
        });
        idUser = user.idUser;

        // A Model serves as the SystemObject owner the ingested assets attach to.
        const v1: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eIdentifierIdentifierTypeARK);
        expect(v1).toBeTruthy();
        owner = await UTIL.createModelTest({
            Name: 'Parity Owner Model', DateCreated: UTIL.nowCleansed(), idVCreationMethod: v1!.idVocabulary,
            idVModality: v1!.idVocabulary, idVUnits: v1!.idVocabulary, idVPurpose: v1!.idVocabulary,
            idVFileType: v1!.idVocabulary, idAssetThumbnail: null, CountAnimations: 0, CountCameras: 0,
            CountFaces: 0, CountLights: 0, CountMaterials: 0, CountMeshes: 0, CountVertices: 0,
            CountEmbeddedTextures: 0, CountLinkedTextures: 0, FileEncoding: 'BINARY', IsDracoCompressed: false,
            AutomationTag: null, CountTriangles: 0, Title: '', idModel: 0, Variant: '[]',
        });
        expect(await owner.fetchSystemObject()).toBeTruthy();

        const vAssetType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile);
        expect(vAssetType).toBeTruthy();
        idVAssetType = vAssetType!.idVocabulary;
    });

    test('download-package manifest + OCFL inventory from a real ingest', async () => {
        const manifest: Array<{ FileName: string; StorageSize: number; StorageHash: string | null }> = [];
        let objStorageKey: string = '';

        for (const fileName of FIXTURE_FILES) {
            const ISI: STORE.IngestStreamOrFileInput = {
                readStream: null,
                localFilePath: path.join(FIXTURE_DIR, fileName),
                asset: null,
                FileName: fileName,
                FilePath: '/',
                idAssetGroup: 0,
                idVAssetType,
                allowZipCracking: false,
                idUserCreator: idUser,
                SOBased: owner,
                Comment: SANDBOX_COMMENT,
            };
            const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
            expect(IAR.success).toBe(true);
            const av: DBAPI.AssetVersion | null | undefined = IAR.assetVersions?.[0];
            const asset: DBAPI.Asset | null | undefined = IAR.assets?.[0];
            expect(av).toBeTruthy();
            expect(asset).toBeTruthy();

            manifest.push({
                FileName: av!.FileName,
                StorageSize: Number(av!.StorageSize),
                StorageHash: av!.StorageHash,
            });
            if (fileName === 'Model_Test.obj')
                objStorageKey = asset!.StorageKey ?? '';
        }

        //the delivered package — entry set + per-entry size + hash. Sort
        // by name for a stable order; keep every field (the hash IS the point).
        manifest.sort((a, b) => a.FileName.localeCompare(b.FileName));
        parityCheck('download-package-manifest', manifest);

        //the OCFL inventory.json for the ingested .obj. Locate the object
        // root from the final storage key via the sandbox LocalStorage.
        expect(objStorageKey).toBeTruthy();
        const storage: any = await STORE.StorageFactory.getInstance();
        expect(storage).toBeTruthy();
        const objectRoot: string = storage.ocflRoot.computeLocationObjectRoot(objStorageKey);
        const inventoryPath: string = path.join(objectRoot, 'inventory.json');
        expect(fs.existsSync(inventoryPath)).toBe(true);
        const inventory: any = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
        parityCheck('ocfl-inventory-manifest', inventory, normalizeInventory);
    });

    test('extractDownloads parses the Cook delivery file map', async () => {
        const map: Map<string, string> = await JobCookSIGenerateDownloadsOutput.extractDownloads(COOK_OUTPUT);
        // Map -> plain object keyed by downloadType (stable order via stableStringify).
        const asObject: Record<string, string> = {};
        for (const [k, v] of map)
            asObject[k] = v;
        parityCheck('cook-download-map', asObject);
    });
});
