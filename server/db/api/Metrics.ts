/* eslint-disable camelcase */
import { Prisma } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

/** Period bucket size for time-series output. Values map to MySQL DATE_FORMAT masks. */
export type MetricsGranularity = 'day' | 'week' | 'month' | 'year';

const GRANULARITY_FORMAT: Record<MetricsGranularity, string> = {
    day:   '%Y-%m-%d',
    week:  '%x-W%v',
    month: '%Y-%m',
    year:  '%Y',
};

/** ISO-8601 week key (year-Www) matching MySQL DATE_FORMAT('%x-W%v'): weeks start Monday, week 1 holds the year's first Thursday. */
function isoWeekKey(d: Date): string {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = (date.getUTCDay() + 6) % 7;                  // Mon=0 .. Sun=6
    date.setUTCDate(date.getUTCDate() - day + 3);            // Thursday of this week
    const isoYear = date.getUTCFullYear();
    const firstThursday = new Date(Date.UTC(isoYear, 0, 4)); // Jan 4 is always in week 1
    const firstDay = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
    const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86400000));
    return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

/** Period bucket key for a date, matching the MySQL DATE_FORMAT mask for the granularity. */
function periodKey(d: Date, granularity: MetricsGranularity): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    switch (granularity) {
        case 'day':   return `${y}-${m}-${day}`;
        case 'week':  return isoWeekKey(d);
        case 'month': return `${y}-${m}`;
        case 'year':  return `${y}`;
    }
}

/**
 * Every period bucket from lo to hi (inclusive), in chronological order, paired with the end-of-day of each
 * bucket's last calendar day (capped at hi). `keys` zero-fills gaps in the series; `ends` provides the as-of
 * cutoff for point-in-time snapshots (e.g. currently-published counts).
 */
function enumeratePeriodsWithEnds(lo: Date, hi: Date, granularity: MetricsGranularity): { keys: string[]; ends: Date[] } {
    const keys: string[] = [];
    const ends: Date[] = [];
    const idx: Map<string, number> = new Map();
    const cur = new Date(lo.getFullYear(), lo.getMonth(), lo.getDate());
    const end = new Date(hi.getFullYear(), hi.getMonth(), hi.getDate());
    while (cur.getTime() <= end.getTime()) {
        const k: string = periodKey(cur, granularity);
        const dayEnd: Date = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 23, 59, 59, 999);
        if (!idx.has(k)) { idx.set(k, keys.length); keys.push(k); ends.push(dayEnd); } else
            ends[idx.get(k) as number] = dayEnd;
        cur.setDate(cur.getDate() + 1);
    }
    return { keys, ends };
}

export type MetricsTotals = {
    /** Ingested asset-version rows (every preserved file/version) in the window. */
    assetVersions: number;
    /** Distinct repository objects (SystemObjects) that received an ingested asset version. */
    repositoryObjects: number;
    /** Total bytes of ingested asset versions (full OCFL footprint, all versions). */
    storageBytes: number;
    /** Subset of storageBytes contributed by non-DPO users. */
    storageBytesNonDPO: number;
    /** Distinct non-DPO users with any audited activity in the window. */
    activeNonDPOUsers: number;
    /** Scene publish/update activity: count of published SystemObjectVersions created in the window. */
    scenePublishEvents: number;
    /** Distinct scenes whose latest version was created in the window and is in a published state (newly published/updated). */
    scenesPublished: number;
    /** Distinct scenes whose latest version as of the window end is in a published state (point-in-time snapshot). */
    scenesPublishedCurrent: number;
};

export type MetricsSeriesPoint = MetricsTotals & { period: string };

type WindowRow = {
    assetVersions: number | bigint;
    repositoryObjects: number | bigint;
    storageBytes: number | bigint;
    storageBytesNonDPO: number | bigint;
};
type UsersRow = { activeUsers: number | bigint };

const PUBLISHED_STATE_MIN = 0; // PublishedState > 0 => API Only | Published | Internal (i.e. any EDAN-published state)

/**
 * Metrics — aggregate reporting queries for on-demand / quarterly preservation stats.
 * All windows are inclusive of [lo, hi]; cumulative-to-date is expressed by passing lo = epoch.
 * "non-DPO" is any user whose idUser is not in dpoUserIDs (resolved from config by the caller).
 */
export class Metrics {
    /** Asset-version counts, distinct repository objects, and storage bytes (total + non-DPO) for a window. */
    static async fetchStorageTotals(lo: Date, hi: Date, dpoUserIDs: number[]): Promise<Pick<MetricsTotals, 'assetVersions' | 'repositoryObjects' | 'storageBytes' | 'storageBytesNonDPO'>> {
        const zero = { assetVersions: 0, repositoryObjects: 0, storageBytes: 0, storageBytesNonDPO: 0 };
        try {
            const nonDPOSum: Prisma.Sql = dpoUserIDs.length
                ? Prisma.sql`COALESCE(SUM(CASE WHEN AV.idUserCreator NOT IN (${Prisma.join(dpoUserIDs)}) THEN AV.StorageSize ELSE 0 END), 0)`
                : Prisma.sql`COALESCE(SUM(AV.StorageSize), 0)`;
            const rows: WindowRow[] = await DBC.DBConnection.prisma.$queryRaw<WindowRow[]>(Prisma.sql`
                SELECT COUNT(*) AS assetVersions,
                       COUNT(DISTINCT A.idSystemObject) AS repositoryObjects,
                       COALESCE(SUM(AV.StorageSize), 0) AS storageBytes,
                       ${nonDPOSum} AS storageBytesNonDPO
                FROM AssetVersion AS AV
                JOIN Asset AS A ON (AV.idAsset = A.idAsset)
                WHERE AV.Ingested = 1
                  AND AV.DateCreated BETWEEN ${lo} AND ${hi}`);
            const r: WindowRow | undefined = rows[0];
            if (!r)
                return zero;
            return {
                assetVersions: Number(r.assetVersions),
                repositoryObjects: Number(r.repositoryObjects),
                storageBytes: Number(r.storageBytes),
                storageBytesNonDPO: Number(r.storageBytesNonDPO),
            };
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB, 'metrics storage totals failed', H.Helpers.getErrorString(error), { lo, hi }, 'DB.Metrics');
            return zero;
        }
    }

    /** Distinct non-DPO users with any audited activity in a window. */
    static async fetchActiveNonDPOUsers(lo: Date, hi: Date, dpoUserIDs: number[]): Promise<number> {
        try {
            const notDPO: Prisma.Sql = dpoUserIDs.length ? Prisma.sql`AND AU.idUser NOT IN (${Prisma.join(dpoUserIDs)})` : Prisma.empty;
            const rows: UsersRow[] = await DBC.DBConnection.prisma.$queryRaw<UsersRow[]>(Prisma.sql`
                SELECT COUNT(DISTINCT AU.idUser) AS activeUsers
                FROM Audit AS AU
                WHERE AU.idUser IS NOT NULL
                  ${notDPO}
                  AND AU.AuditDate BETWEEN ${lo} AND ${hi}`);
            return rows[0] ? Number(rows[0].activeUsers) : 0;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB, 'metrics active users failed', H.Helpers.getErrorString(error), { lo, hi }, 'DB.Metrics');
            return 0;
        }
    }

    /**
     * Scene publish activity and distinct scenes newly published in a window.
     *   events         — count of published-state SystemObjectVersions created in the window (raw publish/update activity;
     *                    a scene re-published or re-versioned multiple times contributes multiple events).
     *   distinctScenes — scenes whose *latest* SystemObjectVersion was created in the window and is in a published state.
     *                    Keyed on the latest version only, so scenes later unpublished are excluded and each scene counts once.
     */
    static async fetchScenesPublished(lo: Date, hi: Date): Promise<{ events: number; distinctScenes: number }> {
        try {
            const [eventRows, sceneRows] = await Promise.all([
                DBC.DBConnection.prisma.$queryRaw<{ events: number | bigint }[]>(Prisma.sql`
                    SELECT COUNT(*) AS events
                    FROM SystemObjectVersion AS SOV
                    JOIN SystemObject AS SO ON (SOV.idSystemObject = SO.idSystemObject)
                    WHERE SO.idScene IS NOT NULL
                      AND SOV.PublishedState > ${PUBLISHED_STATE_MIN}
                      AND SOV.DateCreated BETWEEN ${lo} AND ${hi}`),
                DBC.DBConnection.prisma.$queryRaw<{ distinctScenes: number | bigint }[]>(Prisma.sql`
                    SELECT COUNT(DISTINCT SO.idScene) AS distinctScenes
                    FROM SystemObject AS SO
                    JOIN SystemObjectVersion AS SOV ON (SOV.idSystemObjectVersion =
                        (SELECT MAX(SOV2.idSystemObjectVersion) FROM SystemObjectVersion AS SOV2 WHERE SOV2.idSystemObject = SO.idSystemObject))
                    WHERE SO.idScene IS NOT NULL
                      AND SOV.PublishedState > ${PUBLISHED_STATE_MIN}
                      AND SOV.DateCreated BETWEEN ${lo} AND ${hi}`),
            ]);
            return {
                events: eventRows[0] ? Number(eventRows[0].events) : 0,
                distinctScenes: sceneRows[0] ? Number(sceneRows[0].distinctScenes) : 0,
            };
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB, 'metrics scenes published failed', H.Helpers.getErrorString(error), { lo, hi }, 'DB.Metrics');
            return { events: 0, distinctScenes: 0 };
        }
    }

    /** Distinct scenes whose latest SystemObjectVersion as of `asOf` is in a published state (point-in-time snapshot). */
    static async fetchScenesCurrentlyPublished(asOf: Date): Promise<number> {
        try {
            const rows: { distinctScenes: number | bigint }[] = await DBC.DBConnection.prisma.$queryRaw<{ distinctScenes: number | bigint }[]>(Prisma.sql`
                SELECT COUNT(DISTINCT SO.idScene) AS distinctScenes
                FROM SystemObject AS SO
                JOIN SystemObjectVersion AS SOV ON (SOV.idSystemObjectVersion =
                    (SELECT MAX(SOV2.idSystemObjectVersion) FROM SystemObjectVersion AS SOV2
                     WHERE SOV2.idSystemObject = SO.idSystemObject AND SOV2.DateCreated <= ${asOf}))
                WHERE SO.idScene IS NOT NULL
                  AND SOV.PublishedState > ${PUBLISHED_STATE_MIN}`);
            return rows[0] ? Number(rows[0].distinctScenes) : 0;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB, 'metrics scenes currently published failed', H.Helpers.getErrorString(error), { asOf }, 'DB.Metrics');
            return 0;
        }
    }

    /** All summary totals for a window, assembled from the individual aggregate queries. */
    static async fetchTotals(lo: Date, hi: Date, dpoUserIDs: number[]): Promise<MetricsTotals> {
        const [storage, activeNonDPOUsers, scenes, scenesPublishedCurrent] = await Promise.all([
            Metrics.fetchStorageTotals(lo, hi, dpoUserIDs),
            Metrics.fetchActiveNonDPOUsers(lo, hi, dpoUserIDs),
            Metrics.fetchScenesPublished(lo, hi),
            Metrics.fetchScenesCurrentlyPublished(hi),
        ]);
        return {
            ...storage,
            activeNonDPOUsers,
            scenePublishEvents: scenes.events,
            scenesPublished: scenes.distinctScenes,
            scenesPublishedCurrent,
        };
    }

    /** Per-period time series for the same metrics, bucketed by granularity. Periods with no data are omitted. */
    static async fetchSeries(lo: Date, hi: Date, dpoUserIDs: number[], granularity: MetricsGranularity): Promise<MetricsSeriesPoint[]> {
        const fmt: string = GRANULARITY_FORMAT[granularity];
        const points: Map<string, MetricsSeriesPoint> = new Map();
        const point = (period: string): MetricsSeriesPoint => {
            let p: MetricsSeriesPoint | undefined = points.get(period);
            if (!p) {
                p = { period, assetVersions: 0, repositoryObjects: 0, storageBytes: 0, storageBytesNonDPO: 0, activeNonDPOUsers: 0, scenePublishEvents: 0, scenesPublished: 0, scenesPublishedCurrent: 0 };
                points.set(period, p);
            }
            return p;
        };

        try {
            const nonDPOSum: Prisma.Sql = dpoUserIDs.length
                ? Prisma.sql`COALESCE(SUM(CASE WHEN AV.idUserCreator NOT IN (${Prisma.join(dpoUserIDs)}) THEN AV.StorageSize ELSE 0 END), 0)`
                : Prisma.sql`COALESCE(SUM(AV.StorageSize), 0)`;
            const storageRows = await DBC.DBConnection.prisma.$queryRaw<(WindowRow & { period: string })[]>(Prisma.sql`
                SELECT DATE_FORMAT(AV.DateCreated, ${fmt}) AS period,
                       COUNT(*) AS assetVersions,
                       COUNT(DISTINCT A.idSystemObject) AS repositoryObjects,
                       COALESCE(SUM(AV.StorageSize), 0) AS storageBytes,
                       ${nonDPOSum} AS storageBytesNonDPO
                FROM AssetVersion AS AV
                JOIN Asset AS A ON (AV.idAsset = A.idAsset)
                WHERE AV.Ingested = 1
                  AND AV.DateCreated BETWEEN ${lo} AND ${hi}
                GROUP BY period`);
            for (const r of storageRows) {
                const p = point(r.period);
                p.assetVersions = Number(r.assetVersions);
                p.repositoryObjects = Number(r.repositoryObjects);
                p.storageBytes = Number(r.storageBytes);
                p.storageBytesNonDPO = Number(r.storageBytesNonDPO);
            }

            const eventRows = await DBC.DBConnection.prisma.$queryRaw<{ period: string; events: number | bigint }[]>(Prisma.sql`
                SELECT DATE_FORMAT(SOV.DateCreated, ${fmt}) AS period, COUNT(*) AS events
                FROM SystemObjectVersion AS SOV
                JOIN SystemObject AS SO ON (SOV.idSystemObject = SO.idSystemObject)
                WHERE SO.idScene IS NOT NULL
                  AND SOV.PublishedState > ${PUBLISHED_STATE_MIN}
                  AND SOV.DateCreated BETWEEN ${lo} AND ${hi}
                GROUP BY period`);
            for (const r of eventRows)
                point(r.period).scenePublishEvents = Number(r.events);

            const sceneRows = await DBC.DBConnection.prisma.$queryRaw<{ period: string; distinctScenes: number | bigint }[]>(Prisma.sql`
                SELECT DATE_FORMAT(SOV.DateCreated, ${fmt}) AS period, COUNT(DISTINCT SO.idScene) AS distinctScenes
                FROM SystemObject AS SO
                JOIN SystemObjectVersion AS SOV ON (SOV.idSystemObjectVersion =
                    (SELECT MAX(SOV2.idSystemObjectVersion) FROM SystemObjectVersion AS SOV2 WHERE SOV2.idSystemObject = SO.idSystemObject))
                WHERE SO.idScene IS NOT NULL
                  AND SOV.PublishedState > ${PUBLISHED_STATE_MIN}
                  AND SOV.DateCreated BETWEEN ${lo} AND ${hi}
                GROUP BY period`);
            for (const r of sceneRows)
                point(r.period).scenesPublished = Number(r.distinctScenes);

            const notDPO: Prisma.Sql = dpoUserIDs.length ? Prisma.sql`AND AU.idUser NOT IN (${Prisma.join(dpoUserIDs)})` : Prisma.empty;
            const userRows = await DBC.DBConnection.prisma.$queryRaw<{ period: string; activeUsers: number | bigint }[]>(Prisma.sql`
                SELECT DATE_FORMAT(AU.AuditDate, ${fmt}) AS period, COUNT(DISTINCT AU.idUser) AS activeUsers
                FROM Audit AS AU
                WHERE AU.idUser IS NOT NULL
                  ${notDPO}
                  AND AU.AuditDate BETWEEN ${lo} AND ${hi}
                GROUP BY period`);
            for (const r of userRows)
                point(r.period).activeNonDPOUsers = Number(r.activeUsers);

            const { keys, ends } = enumeratePeriodsWithEnds(lo, hi, granularity);

            // Running "currently published" snapshot per bucket end (system growth), swept from the full scene
            // version history up to hi. For each scene we track its latest published state and, at each bucket
            // end, count it if that latest-as-of state is published — carrying state forward across quiet buckets.
            const historyRows = await DBC.DBConnection.prisma.$queryRaw<{ idScene: number | bigint; publishedState: number | bigint; dateCreated: Date }[]>(Prisma.sql`
                SELECT SO.idScene AS idScene, SOV.PublishedState AS publishedState, SOV.DateCreated AS dateCreated
                FROM SystemObjectVersion AS SOV
                JOIN SystemObject AS SO ON (SOV.idSystemObject = SO.idSystemObject)
                WHERE SO.idScene IS NOT NULL
                  AND SOV.DateCreated <= ${hi}
                ORDER BY SO.idScene, SOV.idSystemObjectVersion`);
            const byScene: Map<number, { published: boolean; time: number }[]> = new Map();
            for (const r of historyRows) {
                const idScene: number = Number(r.idScene);
                const arr = byScene.get(idScene) ?? [];
                arr.push({ published: Number(r.publishedState) > PUBLISHED_STATE_MIN, time: new Date(r.dateCreated).getTime() });
                byScene.set(idScene, arr);
            }
            const endTimes: number[] = ends.map(d => d.getTime());
            const growth: number[] = new Array(keys.length).fill(0);
            for (const sovs of byScene.values()) {
                let ptr = 0;
                let published = false;
                for (let i = 0; i < endTimes.length; i++) {
                    while (ptr < sovs.length && sovs[ptr].time <= endTimes[i]) { published = sovs[ptr].published; ptr++; }
                    if (published) growth[i]++;
                }
            }
            keys.forEach((k, i) => { point(k).scenesPublishedCurrent = growth[i]; });

            // Zero-fill gaps so the series is a continuous timeline across the whole range.
            return keys.map(period => point(period));
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB, 'metrics series failed', H.Helpers.getErrorString(error), { lo, hi, granularity }, 'DB.Metrics');
            return [];
        }
    }
}
