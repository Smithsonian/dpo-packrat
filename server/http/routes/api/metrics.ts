import * as DBAPI from '../../../db';
import { ASL, LocalStore } from '../../../utils/localStore';
import { isAuthenticated } from '../../auth';
import { Config, getDPOUserIDs } from '../../../config';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { MetricsGranularity, MetricsTotals, MetricsSeriesPoint } from '../../../db/api/Metrics';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shapeTotals(t: MetricsTotals): any {
    return {
        objectsPreserved: { assetVersions: t.assetVersions, repositoryObjects: t.repositoryObjects },
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
 * GET /api/metrics?start=YYYY-MM-DD&end=YYYY-MM-DD[&series=1][&granularity=month]
 *
 * Preservation reporting for the given inclusive date range (server-local time):
 *   - objects preserved (ingested asset versions + distinct repository objects)
 *   - TB of data preserved (total, and the non-DPO-contributed subset)
 *   - active non-DPO users (distinct users with audited activity)
 *   - scene content published/updated (publish activity + distinct scenes newly published + total currently published)
 *
 * Returns `summary` (delta within the range) and `cumulative` (all-time through `end`).
 * With `series=1`, also returns a per-period array (granularity: day|week|month|year, default month)
 * suitable for plotting. Admin/tools only.
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

    try {
        const dpoUserIDs: number[] = getDPOUserIDs();
        const epoch = new Date(0);

        const [rangeTotals, cumulativeTotals, series] = await Promise.all([
            DBAPI.Metrics.fetchTotals(start, end, dpoUserIDs),
            DBAPI.Metrics.fetchTotals(epoch, end, dpoUserIDs),
            wantSeries ? DBAPI.Metrics.fetchSeries(start, end, dpoUserIDs, granularity) : Promise.resolve(null),
        ]);

        respond(res, true, undefined, {
            range: { start: start.toISOString(), end: end.toISOString(), granularity },
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
