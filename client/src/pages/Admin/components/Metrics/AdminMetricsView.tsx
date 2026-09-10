/* eslint-disable react/jsx-max-props-per-line */
import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, MenuItem, Select, TextField, Tooltip, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useLocation } from 'react-router';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import API, { RequestResponse } from '../../../../api';
import { useUserStore } from '../../../../store';
import GenericBreadcrumbsView from '../../../../components/shared/GenericBreadcrumbsView';

type Granularity = 'day' | 'week' | 'month' | 'year';

type Totals = {
    objectsPreserved: { assetVersions: number; repositoryObjects: number; created: number; updated: number };
    storage: { bytes: number; terabytes: number; bytesNonDPO: number; terabytesNonDPO: number };
    activeNonDPOUsers: number;
    scenes: { publishEvents: number; distinctScenes: number; currentlyPublished: number };
};

type SeriesPoint = {
    period: string;
    assetVersions: number;
    repositoryObjects: number;
    objectsCreated: number;
    objectsUpdated: number;
    storageBytes: number;
    storageTerabytes: number;
    storageBytesNonDPO: number;
    storageTerabytesNonDPO: number;
    activeNonDPOUsers: number;
    scenePublishEvents: number;
    scenesPublished: number;
    scenesPublishedCurrent: number;
};

type MetricsData = {
    range: { start: string; end: string; granularity: Granularity };
    dpo: { userIDs: number[]; count: number };
    summary: Totals;
    cumulative: Totals;
    series?: SeriesPoint[];
};

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto',
        paddingBottom: '15px',
        paddingLeft: '15px',
        paddingRight: '15px',
        margin: '0 auto',
        width: '100%',
        maxWidth: 1100,
    },
    breadcrumbs: {
        display: 'flex',
        alignItems: 'center',
        minHeight: '46px',
        paddingLeft: '20px',
        paddingRight: '20px',
        background: '#ECF5FD',
        color: '#3F536E',
        marginBottom: '15px',
        width: 'fit-content',
    },
    controls: {
        display: 'flex',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '18px',
    },
    presets: {
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        marginBottom: '14px',
    },
    field: { display: 'flex', flexDirection: 'column' },
    fieldLabel: { fontSize: '0.72rem', color: '#3F536E', marginBottom: 2 },
    sectionTitle: {
        fontSize: '1.05rem',
        fontWeight: 600,
        color: palette.primary.main,
        margin: '18px 0 10px',
    },
    tileRow: { display: 'flex', flexWrap: 'wrap', gap: '12px' },
    tile: {
        flex: '1 1 190px',
        minWidth: 190,
        border: '1px solid #C5D9E8',
        borderRadius: 6,
        padding: '12px 14px',
        background: '#FAFCFF',
    },
    tileLabel: { fontSize: '0.75rem', color: '#5B6B7F', marginBottom: 6 },
    infoLabel: { borderBottom: '1px dotted #9AAABD', cursor: 'help' },
    tileValue: { fontSize: '1.5rem', fontWeight: 600, color: '#25384F', lineHeight: 1.1 },
    tileSub: { fontSize: '0.72rem', color: '#7A8Aa0', marginTop: 4 },
    chartCard: {
        border: '1px solid #C5D9E8',
        borderRadius: 6,
        padding: '12px 14px',
        marginTop: '12px',
        background: '#fff',
    },
    chartTitle: { fontSize: '0.85rem', fontWeight: 600, color: '#3F536E', marginBottom: 8 },
    notAuthorized: { padding: '20px', color: '#8B0000' },
    dpoNote: { fontSize: '0.72rem', color: '#7A8Aa0', margin: '4px 0 14px' },
}));

// --- date helpers (local time) ---
function fmtDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function quarterStart(d: Date): Date {
    return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
}

const NUM = (n: number): string => n.toLocaleString();

// Plain-English explanations shown on hover so the metric titles make sense to end users.
const TT = {
    objectsCreated: 'New repository objects whose first-ever ingested version falls in this range — a growth view of net-new entities entering the repository.',
    objectsUpdated: 'Pre-existing repository objects (created before this range) that received a new ingested version in the range. Add to Objects Created for the total distinct objects touched.',
    objectsTouched: 'Distinct repository objects (models, scenes, capture data, etc.) that received ingested content in the range, whether newly created or updated. Counts each object once.',
    events: 'Preservation events: every ingested file version in the range, counting re-ingests and regenerated derivatives. A work-volume view — one object can contribute many events.',
    objects: 'Distinct repository objects (models, scenes, capture data, etc.) that received ingested content. Many file versions can roll up into one object.',
    assetVersions: 'Every preserved file version ingested. Each re-ingest of a file adds another version.',
    data: 'Total size of ingested file versions (full storage footprint across all versions).',
    dataNonDPO: 'Portion of the preserved data contributed by users outside the DPO team.',
    activeUsers: 'Distinct non-DPO users with any audited activity in the selected range.',
    scenesRange: 'Scenes whose latest version was created in this range and is currently in a published (EDAN) state. Counts each scene once; excludes scenes later unpublished.',
    publishEvents: 'Raw publish activity: every published-state version created in the range, including repeated re-publishes of the same scene.',
    scenesCurrent: 'Total scenes currently published (EDAN) as of the end date, based on each scene’s latest version. This is a snapshot, not a sum of the range.',
    scenesGrowth: 'Running total of scenes currently published at the end of each period — a system-growth view. Can dip when scenes are unpublished.',
};

// Auto-scaling byte formatter (decimal units, matching the 10^12 TB used for reporting).
function formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1000)));
    const val = bytes / Math.pow(1000, i);
    return `${val.toLocaleString(undefined, { maximumFractionDigits: i >= 3 ? 2 : 1 })} ${units[i]}`;
}

// --- minimal dependency-free bar chart ---
function BarChart({ points, getValue, color, format }: { points: SeriesPoint[]; getValue: (p: SeriesPoint) => number; color: string; format?: (n: number) => string }): React.ReactElement {
    const fmt = format ?? NUM;
    const width = 640, height = 160, padL = 8, padR = 8, padB = 22, padT = 20;
    const vals = points.map(getValue);
    const realMax = points.length ? Math.max(...vals) : 0;
    if (points.length === 0 || realMax === 0)
        return <Typography style={{ fontSize: '0.8rem', color: '#7A8Aa0' }}>No data in range.</Typography>;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    const bw = plotW / points.length;
    const showBarLabels = points.length <= 24;
    const labelEvery = Math.ceil(points.length / 12);
    return (
        <svg viewBox={`0 0 ${width} ${height}`} width='100%' role='img'>
            <text x={padL} y={11} fontSize='9' fill='#7A8Aa0'>peak {fmt(realMax)}</text>
            {points.map((p, i) => {
                const v = vals[i];
                const h = (v / realMax) * plotH;
                const x = padL + i * bw;
                const y = padT + (plotH - h);
                const cx = x + bw / 2;
                return (
                    <g key={p.period}>
                        <rect x={x + bw * 0.12} y={y} width={bw * 0.76} height={h} fill={color} rx={1}>
                            <title>{`${p.period}: ${fmt(v)}`}</title>
                        </rect>
                        {showBarLabels && v > 0 && (
                            <text x={cx} y={y - 3} textAnchor='middle' fontSize='8' fill='#25384F'>{fmt(v)}</text>
                        )}
                        {i % labelEvery === 0 && (
                            <text x={cx} y={height - 7} textAnchor='middle' fontSize='8' fill='#7A8Aa0'>{p.period}</text>
                        )}
                    </g>
                );
            })}
            <line x1={padL} y1={padT + plotH} x2={width - padR} y2={padT + plotH} stroke='#C5D9E8' strokeWidth='1' />
        </svg>
    );
}

function Tile({ label, value, sub, info }: { label: string; value: string; sub?: string; info?: string }): React.ReactElement {
    const classes = useStyles();
    const labelEl = info
        ? <Tooltip title={info} arrow><span className={classes.infoLabel}>{label}</span></Tooltip>
        : <span>{label}</span>;
    return (
        <Box className={classes.tile}>
            <div className={classes.tileLabel}>{labelEl}</div>
            <div className={classes.tileValue}>{value}</div>
            {sub && <div className={classes.tileSub}>{sub}</div>}
        </Box>
    );
}

// Chart heading with an optional hover tooltip explaining what the series shows.
function ChartTitle({ title, info }: { title: string; info?: string }): React.ReactElement {
    const classes = useStyles();
    if (!info)
        return <div className={classes.chartTitle}>{title}</div>;
    return (
        <Tooltip title={info} arrow>
            <div className={`${classes.chartTitle} ${classes.infoLabel}`}>{title}</div>
        </Tooltip>
    );
}

function AdminMetricsView(): React.ReactElement {
    const classes = useStyles();
    const location = useLocation();
    const { user } = useUserStore();
    const isAuthorized = (user?.canAccessTools ?? false) || (user?.isAdmin ?? false);

    const today = new Date();
    const [start, setStart] = useState<string>(fmtDate(quarterStart(today)));
    const [end, setEnd] = useState<string>(fmtDate(today));
    const [granularity, setGranularity] = useState<Granularity>('month');
    const [data, setData] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const result: RequestResponse = await API.getMetrics(start, end, true, granularity);
            if (!result?.success) {
                toast.error(result?.message ?? 'Failed to load metrics');
                return;
            }
            setData(result.data as MetricsData);
        } catch (error) {
            toast.error('Failed to load metrics');
        } finally {
            setLoading(false);
        }
    }, [start, end, granularity]);

    useEffect(() => { if (isAuthorized) fetchData(); /* initial load */ }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const applyPreset = (kind: 'thisQ' | 'lastQ' | 'ytd' | 'last12'): void => {
        const now = new Date();
        if (kind === 'thisQ') { setStart(fmtDate(quarterStart(now))); setEnd(fmtDate(now)); } else if (kind === 'lastQ') {
            const qs = quarterStart(now);
            const lastQEnd = new Date(qs.getTime() - 86400000);
            setStart(fmtDate(quarterStart(lastQEnd))); setEnd(fmtDate(lastQEnd));
        } else if (kind === 'ytd') { setStart(`${now.getFullYear()}-01-01`); setEnd(fmtDate(now)); } else if (kind === 'last12') {
            const from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            setStart(fmtDate(from)); setEnd(fmtDate(now));
        }
    };

    const downloadJSON = (): void => {
        if (!data) return;
        // Omit the DPO user-ID list from the exported report; keep only the aggregate count.
        const exportData = { ...data, dpo: { count: data.dpo.count } };
        triggerDownload(JSON.stringify(exportData, null, 2), `packrat-metrics_${start}_${end}.json`, 'application/json');
    };
    const downloadCSV = (): void => {
        if (!data?.series) return;
        const header = ['period', 'assetVersions', 'repositoryObjects', 'objectsCreated', 'objectsUpdated', 'storageBytes', 'storageBytesNonDPO', 'storageTerabytes', 'storageTerabytesNonDPO', 'activeNonDPOUsers', 'scenePublishEvents', 'scenesPublished', 'scenesPublishedCurrent'];
        const lines = data.series.map(p => [p.period, p.assetVersions, p.repositoryObjects, p.objectsCreated, p.objectsUpdated, p.storageBytes, p.storageBytesNonDPO, p.storageTerabytes, p.storageTerabytesNonDPO, p.activeNonDPOUsers, p.scenePublishEvents, p.scenesPublished, p.scenesPublishedCurrent].join(','));
        triggerDownload([header.join(','), ...lines].join('\n'), `packrat-metrics_${start}_${end}.csv`, 'text/csv');
    };

    if (!isAuthorized)
        return (
            <Box className={classes.container}>
                <p className={classes.notAuthorized}>You are <b>Not Authorized</b> to view metrics.</p>
            </Box>
        );

    const series: SeriesPoint[] = data?.series ?? [];

    return (
        <React.Fragment>
            <Helmet><title>Admin: Metrics</title></Helmet>
            <Box className={classes.container}>
                <Box className={classes.breadcrumbs}>
                    <GenericBreadcrumbsView items={location.pathname.slice(1)} />
                </Box>

                <div className={classes.presets}>
                    <Button size='small' variant='outlined' onClick={() => applyPreset('thisQ')}>This Quarter</Button>
                    <Button size='small' variant='outlined' onClick={() => applyPreset('lastQ')}>Last Quarter</Button>
                    <Button size='small' variant='outlined' onClick={() => applyPreset('ytd')}>Year to Date</Button>
                    <Button size='small' variant='outlined' onClick={() => applyPreset('last12')}>Last 12 Months</Button>
                </div>

                <Box className={classes.controls}>
                    <div className={classes.field}>
                        <span className={classes.fieldLabel}>Start</span>
                        <TextField type='date' size='small' variant='outlined' value={start} onChange={e => setStart(e.target.value)} />
                    </div>
                    <div className={classes.field}>
                        <span className={classes.fieldLabel}>End</span>
                        <TextField type='date' size='small' variant='outlined' value={end} onChange={e => setEnd(e.target.value)} />
                    </div>
                    <div className={classes.field}>
                        <span className={classes.fieldLabel}>Granularity</span>
                        <Select value={granularity} onChange={e => setGranularity(e.target.value as Granularity)} variant='outlined' style={{ height: 40, minWidth: 110 }}>
                            <MenuItem value='day'>Day</MenuItem>
                            <MenuItem value='week'>Week</MenuItem>
                            <MenuItem value='month'>Month</MenuItem>
                            <MenuItem value='year'>Year</MenuItem>
                        </Select>
                    </div>
                    <Button variant='contained' color='primary' onClick={fetchData} disabled={loading}>{loading ? 'Loading…' : 'Run'}</Button>
                    <Button variant='outlined' onClick={downloadCSV} disabled={!data?.series}>CSV</Button>
                    <Button variant='outlined' onClick={downloadJSON} disabled={!data}>JSON</Button>
                </Box>

                {data && (
                    <>
                        <div className={classes.dpoNote}>
                            Range {new Date(data.range.start).toLocaleDateString()} – {new Date(data.range.end).toLocaleDateString()} ·
                            {' '}Non-DPO = users outside the DPO set ({data.dpo.count} DPO user{data.dpo.count === 1 ? '' : 's'}).
                        </div>

                        <div className={classes.sectionTitle}>Selected Range</div>
                        <Box className={classes.tileRow}>
                            <Tile label='Objects Created' value={NUM(data.summary.objectsPreserved.created)} sub='net-new entities' info={TT.objectsCreated} />
                            <Tile label='Objects Updated' value={NUM(data.summary.objectsPreserved.updated)} sub='existing objects revised' info={TT.objectsUpdated} />
                            <Tile label='Preservation Events' value={NUM(data.summary.objectsPreserved.assetVersions)} sub='file versions ingested' info={TT.events} />
                            <Tile label='Data Preserved' value={formatBytes(data.summary.storage.bytes)} info={TT.data} />
                            <Tile label='Data Preserved (non-DPO)' value={formatBytes(data.summary.storage.bytesNonDPO)} info={TT.dataNonDPO} />
                            <Tile label='Active non-DPO Users' value={NUM(data.summary.activeNonDPOUsers)} info={TT.activeUsers} />
                            <Tile label='Scenes Published/Updated' value={NUM(data.summary.scenes.distinctScenes)} sub={`${NUM(data.summary.scenes.publishEvents)} publish events`} info={TT.scenesRange} />
                        </Box>

                        <div className={classes.sectionTitle}>Cumulative (through end date)</div>
                        <Box className={classes.tileRow}>
                            <Tile label='Objects (total)' value={NUM(data.cumulative.objectsPreserved.repositoryObjects)} info={TT.objectsTouched} />
                            <Tile label='Preservation Events (total)' value={NUM(data.cumulative.objectsPreserved.assetVersions)} sub='file versions ingested' info={TT.events} />
                            <Tile label='Data Preserved' value={formatBytes(data.cumulative.storage.bytes)} info={TT.data} />
                            <Tile label='Data Preserved (non-DPO)' value={formatBytes(data.cumulative.storage.bytesNonDPO)} info={TT.dataNonDPO} />
                            <Tile label='Scenes Published (total)' value={NUM(data.cumulative.scenes.currentlyPublished)} info={TT.scenesCurrent} />
                        </Box>

                        <div className={classes.sectionTitle}>Over Time</div>
                        <Box className={classes.chartCard}>
                            <ChartTitle title='Data preserved per period' info={TT.data} />
                            <BarChart points={series} getValue={p => p.storageBytes} color='#2B7DE9' format={formatBytes} />
                        </Box>
                        <Box className={classes.chartCard}>
                            <ChartTitle title='Objects created per period' info={TT.objectsCreated} />
                            <BarChart points={series} getValue={p => p.objectsCreated} color='#37A66B' />
                        </Box>
                        <Box className={classes.chartCard}>
                            <ChartTitle title='Objects updated per period' info={TT.objectsUpdated} />
                            <BarChart points={series} getValue={p => p.objectsUpdated} color='#2FA0A0' />
                        </Box>
                        <Box className={classes.chartCard}>
                            <ChartTitle title='Preservation events per period' info={TT.events} />
                            <BarChart points={series} getValue={p => p.assetVersions} color='#C58A2E' />
                        </Box>
                        <Box className={classes.chartCard}>
                            <ChartTitle title='Scenes published/updated per period' info={TT.scenesRange} />
                            <BarChart points={series} getValue={p => p.scenesPublished} color='#B07CE0' />
                        </Box>
                        <Box className={classes.chartCard}>
                            <ChartTitle title='Scenes currently published (running total)' info={TT.scenesGrowth} />
                            <BarChart points={series} getValue={p => p.scenesPublishedCurrent} color='#6C63C4' />
                        </Box>
                        <Box className={classes.chartCard}>
                            <ChartTitle title='Active non-DPO users per period' info={TT.activeUsers} />
                            <BarChart points={series} getValue={p => p.activeNonDPOUsers} color='#E0913C' />
                        </Box>
                    </>
                )}
            </Box>
        </React.Fragment>
    );
}

function triggerDownload(content: string, filename: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default AdminMetricsView;
