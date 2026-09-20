import * as DBAPI from '../../../db';
import { ASL, LocalStore } from '../../../utils/localStore';
import { isAuthenticated } from '../../auth';
import { Config, getDPOUserIDs } from '../../../config';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { MetricsGranularity, MetricsTotals, MetricsSeriesPoint, MetricsObjectTypeBreakdown } from '../../../db/api/Metrics';
import { Request, Response } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function respond(res: Response, success: boolean, message: string | undefined, data?: any): void {
    res.status(200).send(JSON.stringify({ success, message, data }));
}

const BYTES_PER_TB = 1_000_000_000_000; // decimal TB (10^12), matches storage-vendor / management reporting
const GRANULARITIES: MetricsGranularity[] = ['day', 'week', 'month', 'year'];
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parses a start/end param. Date-only values are widened to the day's start or end in server-local time. */
function parseDate(raw: string, endOfDay: boolean): Date | null {
    if (DATE_ONLY_RE.test(raw)) {
        const [y, m, d] = raw.split('-').map(n => parseInt(n, 10));
        return endOfDay ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d, 0, 0, 0, 0);
    }
    const parsed: Date = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toTB(bytes: number): number {
    return Math.round((bytes / BYTES_PER_TB) * 10000) / 10000;
}

/** Per-type updated counts, derived as touched (repositoryObjects) minus created for each repository-object type. */
function updatedByType(touched: MetricsObjectTypeBreakdown, created: MetricsObjectTypeBreakdown): MetricsObjectTypeBreakdown {
    return {
        model: Math.max(0, touched.model - created.model),
        scene: Math.max(0, touched.scene - created.scene),
        captureData: Math.max(0, touched.captureData - created.captureData),
        other: Math.max(0, touched.other - created.other),
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shapeTotals(t: MetricsTotals): any {
    return {
        objectsPreserved: {
            assetVersions: t.assetVersions,                                         // preservation events (work volume, counts re-ingests)
            repositoryObjects: t.repositoryObjects,                                 // distinct objects touched (created or updated)
            created: t.objectsCreated,                                              // newly created objects (first version in window)
            updated: Math.max(0, t.repositoryObjects - t.objectsCreated),           // pre-existing objects revised in window
            byType: {
                touched: t.repositoryObjectsByType,                                 // repositoryObjects split by type
                created: t.objectsCreatedByType,                                    // created split by type
                updated: updatedByType(t.repositoryObjectsByType, t.objectsCreatedByType),
            },
        },
        subjectsWithCaptureCreated: t.subjectsWithCaptureCreated,                    // distinct subjects with newly-created capture data
        mediaGroupsWithCaptureCreated: t.mediaGroupsWithCaptureCreated,              // distinct media groups (items) with newly-created capture data
        storage: {
            bytes: t.storageBytes,
            terabytes: toTB(t.storageBytes),
            bytesNonDPO: t.storageBytesNonDPO,
            terabytesNonDPO: toTB(t.storageBytesNonDPO),
        },
        activeNonDPOUsers: t.activeNonDPOUsers,
        scenes: { publishEvents: t.scenePublishEvents, distinctScenes: t.scenesPublished, currentlyPublished: t.scenesPublishedCurrent },
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shapeSeriesPoint(p: MetricsSeriesPoint): any {
    return {
        period: p.period,
        assetVersions: p.assetVersions,
        repositoryObjects: p.repositoryObjects,
        objectsCreated: p.objectsCreated,
        objectsUpdated: Math.max(0, p.repositoryObjects - p.objectsCreated),
        objectsCreatedByType: p.objectsCreatedByType,
        objectsUpdatedByType: updatedByType(p.repositoryObjectsByType, p.objectsCreatedByType),
        subjectsWithCaptureCreated: p.subjectsWithCaptureCreated,
        mediaGroupsWithCaptureCreated: p.mediaGroupsWithCaptureCreated,
        storageBytes: p.storageBytes,
        storageTerabytes: toTB(p.storageBytes),
        storageBytesNonDPO: p.storageBytesNonDPO,
        storageTerabytesNonDPO: toTB(p.storageBytesNonDPO),
        activeNonDPOUsers: p.activeNonDPOUsers,
        scenePublishEvents: p.scenePublishEvents,
        scenesPublished: p.scenesPublished,
        scenesPublishedCurrent: p.scenesPublishedCurrent,
    };
}

/**
 * GET /api/metrics?start=YYYY-MM-DD&end=YYYY-MM-DD[&series=1][&granularity=month][&project=<idProject>]
 *
 * Preservation reporting for the given inclusive date range (server-local time):
 *   - objects preserved (ingested asset versions + distinct repository objects)
 *   - TB of data preserved (total, and the non-DPO-contributed subset)
 *   - active non-DPO users (distinct users with audited activity)
 *   - scene content published/updated (publish activity + distinct scenes newly published + total currently published)
 *
 * Returns `summary` (delta within the range) and `cumulative` (all-time through `end`).
 * With `series=1`, also returns a per-period array (granularity: day|week|month|year, default month)
 * suitable for plotting. With `project=<idProject>`, object, storage, and scene metrics are scoped to objects
 * belonging to that project (via the Project -> Item -> object tree); active-user counts remain global. Admin/tools only.
 */
export async function getMetrics(req: Request, res: Response): Promise<void> {
    if (!isAuthenticated(req)) {
        respond(res, false, 'getMetrics: not authenticated');
        return;
    }
    const LS: LocalStore | undefined = ASL.getStore();
    if (!LS || !LS.idUser) {
        respond(res, false, 'getMetrics: missing local store/user');
        return;
    }
    const authorized: number[] = [...new Set([...Config.auth.users.admin, ...Config.auth.users.tools])];
    if (!authorized.includes(LS.idUser)) {
        respond(res, false, 'getMetrics: not authorized');
        return;
    }

    const startRaw: string = String(req.query.start ?? '');
    const endRaw: string = String(req.query.end ?? '');
    if (!startRaw || !endRaw) {
        respond(res, false, 'getMetrics: start and end query params are required (YYYY-MM-DD)');
        return;
    }
    const start: Date | null = parseDate(startRaw, false);
    const end: Date | null = parseDate(endRaw, true);
    if (!start || !end) {
        respond(res, false, 'getMetrics: start/end must be valid dates (YYYY-MM-DD or ISO)');
        return;
    }
    if (start.getTime() > end.getTime()) {
        respond(res, false, 'getMetrics: start must be on or before end');
        return;
    }

    const wantSeries: boolean = req.query.series === '1' || req.query.series === 'true';
    const granularityRaw: string = String(req.query.granularity ?? 'month').toLowerCase();
    const granularity: MetricsGranularity = (GRANULARITIES as string[]).includes(granularityRaw)
        ? granularityRaw as MetricsGranularity : 'month';

    // Optional project filter. Absent, non-numeric, or non-positive (e.g. 'all') => null => all-projects (unfiltered) view.
    const projectRaw: string = String(req.query.project ?? '');
    const projectParsed: number = parseInt(projectRaw, 10);
    const idProject: number | null = Number.isInteger(projectParsed) && projectParsed > 0 ? projectParsed : null;

    try {
        const dpoUserIDs: number[] = getDPOUserIDs();
        const epoch = new Date(0);

        const [rangeTotals, cumulativeTotals, series] = await Promise.all([
            DBAPI.Metrics.fetchTotals(start, end, dpoUserIDs, idProject),
            DBAPI.Metrics.fetchTotals(epoch, end, dpoUserIDs, idProject),
            wantSeries ? DBAPI.Metrics.fetchSeries(start, end, dpoUserIDs, granularity, idProject) : Promise.resolve(null),
        ]);

        respond(res, true, undefined, {
            range: { start: start.toISOString(), end: end.toISOString(), granularity, project: idProject },
            dpo: { userIDs: dpoUserIDs, count: dpoUserIDs.length },
            summary: shapeTotals(rangeTotals),
            cumulative: shapeTotals(cumulativeTotals),
            series: series ? series.map(shapeSeriesPoint) : undefined,
        });
    } catch (error) {
        RK.logError(RK.LogSection.eHTTP, 'getMetrics failed',
            error instanceof Error ? error.message : String(error), { startRaw, endRaw }, 'HTTP.Route.Metrics');
        respond(res, false, `getMetrics: ${error instanceof Error ? error.message : 'unexpected error'}`);
    }
}
