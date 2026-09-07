/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs-extra';
import * as path from 'path';
import * as DBAPI from '../../../db';
import { ASL, LocalStore } from '../../../utils/localStore';
import { isAuthenticated } from '../../auth';
import { Config } from '../../../config';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { Request, Response } from 'express';

/**
 * EDAN resource-folder retention cleanup.
 *   GET  /api/system/edan-cleanup?days=N   — preview (read-only): what WOULD be removed.
 *   POST /api/system/edan-cleanup?days=N   — execute: remove the eligible entries.
 *
 * Two network folders accumulate per-scene artifacts each publish, with no lifecycle:
 *   - the resources hot folder: one `<EdanUUID>/` subdir of downloadable resources (drained by the 3D API).
 *   - the EDAN upsert/staging root: one `<EdanUUID>.zip` package (fetched by the 3D API).
 * Packrat regenerates both on every re-publish and never reclaims old ones, so they grow unbounded.
 *
 * Eligibility (both must hold): the entry is older than `days`, AND its scene (by EdanUUID) is NOT
 * currently published — a live scene's package/resources are never touched regardless of age. Only
 * entries named by a valid EdanUUID are ever considered, so unrelated files in those folders are safe.
 */

const SRC: string = 'HTTP.Route.EdanCleanup';
const DEFAULT_RETENTION_DAYS: number = 30;
const MIN_RETENTION_DAYS: number = 1;
const MS_PER_DAY: number = 86_400_000;
const UUID_RE: RegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function respond(res: Response, success: boolean, message: string | undefined, data?: any): void {
    res.status(200).send(JSON.stringify({ success, message, data }));
}

type Candidate = { name: string; uuid: string; fullPath: string; sizeBytes: number; mtimeMs: number };
type FolderReport = {
    label: string;
    root: string;
    exists: boolean;
    managedEntries: number;      // entries named by a valid EdanUUID
    protectedSkipped: number;    // eligible by age but scene is currently published
    recentSkipped: number;       // newer than the retention cutoff
    candidateCount: number;      // eligible for removal
    candidateBytes: number;
    oldestCandidateDate: string | null;
    newestCandidateDate: string | null;
};

async function dirSizeBytes(dir: string): Promise<number> {
    let total: number = 0;
    let names: string[];
    try {
        names = await fs.readdir(dir);
    } catch {
        return 0;
    }
    for (const name of names) {
        const full: string = path.join(dir, name);
        try {
            const st: fs.Stats = await fs.stat(full);
            if (st.isDirectory())
                total += await dirSizeBytes(full);
            else
                total += st.size;
        } catch { /* ignore unreadable entry */ }
    }
    return total;
}

// Scan one folder for removable entries. mode 'dir' expects `<uuid>/` subdirs (hot folder); mode 'zip'
// expects `<uuid>.zip` files (upsert root). Returns a report and the concrete candidate list.
async function scanFolder(label: string, root: string, mode: 'dir' | 'zip', cutoffMs: number,
    protectedUUIDs: Set<string>): Promise<{ report: FolderReport; candidates: Candidate[] }> {

    const report: FolderReport = { label, root, exists: false, managedEntries: 0, protectedSkipped: 0,
        recentSkipped: 0, candidateCount: 0, candidateBytes: 0, oldestCandidateDate: null, newestCandidateDate: null };
    const candidates: Candidate[] = [];

    if (!root || !(await fs.pathExists(root)))
        return { report, candidates };
    report.exists = true;

    let names: string[];
    try {
        names = await fs.readdir(root);
    } catch (error) {
        RK.logError(RK.LogSection.eHTTP, 'edan cleanup scan failed', error instanceof Error ? error.message : String(error), { root }, SRC);
        return { report, candidates };
    }

    let oldest: number | null = null;
    let newest: number | null = null;
    for (const name of names) {
        const fullPath: string = path.join(root, name);
        let st: fs.Stats;
        try {
            st = await fs.stat(fullPath);
        } catch {
            continue;
        }

        // Only ever touch entries named by a valid EdanUUID — never arbitrary files in the folder.
        let uuid: string | null = null;
        if (mode === 'dir' && st.isDirectory() && UUID_RE.test(name))
            uuid = name;
        else if (mode === 'zip' && st.isFile() && name.toLowerCase().endsWith('.zip') && UUID_RE.test(name.slice(0, -4)))
            uuid = name.slice(0, -4);
        if (!uuid)
            continue;

        report.managedEntries++;
        const mtimeMs: number = st.mtimeMs;

        if (protectedUUIDs.has(uuid.toLowerCase())) {
            report.protectedSkipped++;
            continue;
        }
        if (mtimeMs > cutoffMs) {
            report.recentSkipped++;
            continue;
        }

        const sizeBytes: number = (mode === 'dir') ? await dirSizeBytes(fullPath) : st.size;
        candidates.push({ name, uuid, fullPath, sizeBytes, mtimeMs });
        report.candidateBytes += sizeBytes;
        oldest = (oldest === null) ? mtimeMs : Math.min(oldest, mtimeMs);
        newest = (newest === null) ? mtimeMs : Math.max(newest, mtimeMs);
    }
    report.candidateCount = candidates.length;
    report.oldestCandidateDate = oldest !== null ? new Date(oldest).toISOString() : null;
    report.newestCandidateDate = newest !== null ? new Date(newest).toISOString() : null;
    return { report, candidates };
}

// Set of EdanUUIDs whose scene is currently in a published EDAN state — never removed regardless of age.
async function publishedUUIDs(): Promise<Set<string>> {
    const set: Set<string> = new Set<string>();
    const rows: DBAPI.EdanPublishedSceneRow[] = await DBAPI.Scene.fetchEdanPublished();
    for (const r of rows)
        if (r.EdanUUID)
            set.add(r.EdanUUID.toLowerCase());
    return set;
}

export async function edanCleanup(req: Request, res: Response): Promise<void> {
    if (!isAuthenticated(req)) {
        respond(res, false, 'edanCleanup: not authenticated');
        return;
    }
    const LS: LocalStore | undefined = ASL.getStore();
    if (!LS || !LS.idUser) {
        respond(res, false, 'edanCleanup: missing local store/user');
        return;
    }
    const authorized: number[] = [...new Set([...Config.auth.users.admin, ...Config.auth.users.tools])];
    if (!authorized.includes(LS.idUser)) {
        respond(res, false, 'edanCleanup: not authorized');
        return;
    }

    const daysRaw: number = Number(req.query.days);
    const days: number = Number.isFinite(daysRaw) && daysRaw >= MIN_RETENTION_DAYS ? Math.floor(daysRaw) : DEFAULT_RETENTION_DAYS;
    const execute: boolean = req.method === 'POST';
    const cutoffMs: number = Date.now() - days * MS_PER_DAY;

    try {
        const protectedSet: Set<string> = await publishedUUIDs();
        const hot = await scanFolder('Resources hot folder', Config.collection.edan.resourcesHotFolder, 'dir', cutoffMs, protectedSet);
        const upload = await scanFolder('Upsert package root', Config.collection.edan.stagingRoot, 'zip', cutoffMs, protectedSet);
        const folders = [hot, upload];

        if (!execute) {
            const totalBytes: number = folders.reduce((s, f) => s + f.report.candidateBytes, 0);
            const totalCount: number = folders.reduce((s, f) => s + f.report.candidateCount, 0);
            respond(res, true, undefined, {
                mode: 'preview', days, protectedScenes: protectedSet.size,
                folders: folders.map(f => f.report), totalCandidateCount: totalCount, totalCandidateBytes: totalBytes,
            });
            return;
        }

        // Execute: remove each candidate (recomputed fresh above, never from a stale client list).
        let deletedCount: number = 0;
        let reclaimedBytes: number = 0;
        const perFolder: { label: string; deletedCount: number; reclaimedBytes: number }[] = [];
        for (const f of folders) {
            let fDeleted: number = 0, fBytes: number = 0;
            for (const c of f.candidates) {
                try {
                    await fs.remove(c.fullPath);
                    fDeleted++; fBytes += c.sizeBytes;
                    RK.logInfo(RK.LogSection.eHTTP, 'edan cleanup removed', undefined, { folder: f.report.label, name: c.name, uuid: c.uuid, sizeBytes: c.sizeBytes }, SRC);
                } catch (error) {
                    RK.logError(RK.LogSection.eHTTP, 'edan cleanup remove failed', error instanceof Error ? error.message : String(error), { path: c.fullPath }, SRC);
                }
            }
            perFolder.push({ label: f.report.label, deletedCount: fDeleted, reclaimedBytes: fBytes });
            deletedCount += fDeleted; reclaimedBytes += fBytes;
        }
        RK.logInfo(RK.LogSection.eHTTP, 'edan cleanup complete', undefined, { days, deletedCount, reclaimedBytes, idUser: LS.idUser }, SRC);
        respond(res, true, `Removed ${deletedCount} item(s), reclaimed ${(reclaimedBytes / 1e9).toFixed(2)} GB`,
            { mode: 'execute', days, deletedCount, reclaimedBytes, perFolder });
    } catch (error) {
        RK.logError(RK.LogSection.eHTTP, 'edanCleanup failed', error instanceof Error ? error.message : String(error), { days, execute }, SRC);
        respond(res, false, `edanCleanup: ${error instanceof Error ? error.message : 'unexpected error'}`);
    }
}
