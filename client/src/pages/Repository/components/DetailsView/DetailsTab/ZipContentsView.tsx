/**
 * ZipContentsView
 *
 * Lists the central-directory contents of a ZIP asset version. Calls the
 * REST endpoint /api/zip-contents/:idAssetVersion for the listing, and renders
 * a paginated/searchable table via PaginatedSearchableTable.
 *
 * When the asset version has a successful volumetric inspection, the inspection's
 * scan-sheet and scan-log paths are surfaced as Preview links that open the
 * /api/zip-entry endpoint directly (binary stream piped to the browser).
 *
 * Generic — works for any ZIP asset (volumetric, photogrammetry bulk, scene
 * archive, etc.). Embedded inline on the Asset detail page.
 */
import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@material-ui/core';
import API from '../../../../../api';
import { PaginatedSearchableTable, PaginatedColumn } from '../../../../../components/shared/PaginatedSearchableTable';

interface ZipEntry {
    path: string;
    fileName: string;
    size: number;
    compressedSize: number;
}

interface ZipContentsData {
    entries: ZipEntry[];
    totalUncompressedSize: number;
    entryCount: number;
}

interface VolumeInspectionMetadata {
    scanSheetPaths?: string[];
    scanLogPaths?: string[];
}

interface Props {
    idAssetVersion: number;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function ZipContentsView({ idAssetVersion }: Props): JSX.Element {
    const [data, setData] = useState<ZipContentsData | null>(null);
    const [inspectablePaths, setInspectablePaths] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let cancelled = false;
        async function load(): Promise<void> {
            setLoading(true);
            setError(null);
            try {
                const result = await API.getZipContents(idAssetVersion);
                if (cancelled) return;
                if (!result.success) {
                    setError(result.message ?? 'Failed to load ZIP contents');
                    setData(null);
                } else {
                    setData(result.data as ZipContentsData);
                }

                // Best-effort: try to fetch inspection metadata for inspection-flagged
                // entries (scan sheets / logs) so they get a Preview action. If the
                // asset isn't volumetric or hasn't been inspected this returns null —
                // we just skip the previews and show the listing alone.
                const insp = await API.getVolumetricInspectionResults(idAssetVersion);
                if (cancelled) return;
                if (insp.success && insp.data) {
                    const meta = insp.data as VolumeInspectionMetadata;
                    const flagged = new Set<string>();
                    (meta.scanSheetPaths ?? []).forEach(p => flagged.add(p));
                    (meta.scanLogPaths ?? []).forEach(p => flagged.add(p));
                    setInspectablePaths(flagged);
                }
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : String(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [idAssetVersion]);

    const columns: PaginatedColumn<ZipEntry>[] = [
        { key: 'fileName', label: 'File Name', width: '30%' },
        { key: 'path', label: 'Path', width: '50%' },
        { key: 'size', label: 'Size', align: 'right', format: row => formatBytes(row.size) },
    ];

    const rowActions = (row: ZipEntry): JSX.Element | null => {
        if (!inspectablePaths.has(row.path)) return null;
        return (
            <Button
                size='small'
                variant='outlined'
                color='primary'
                component='a'
                href={API.zipEntryUrl(idAssetVersion, row.path)}
                target='_blank'
                rel='noopener noreferrer'
            >
                Preview
            </Button>
        );
    };

    if (loading)
        return <Box p={2}><Typography variant='body2' color='textSecondary'>Loading ZIP contents…</Typography></Box>;

    if (error)
        return <Box p={2}><Typography variant='body2' color='error'>ZIP contents unavailable: {error}</Typography></Box>;

    if (!data || data.entries.length === 0)
        return <Box p={2}><Typography variant='body2' color='textSecondary'>This ZIP appears to be empty.</Typography></Box>;

    const caption = (
        <Typography variant='caption' color='textSecondary'>
            {data.entryCount} entries · {formatBytes(data.totalUncompressedSize)} total uncompressed
        </Typography>
    );

    return (
        <Box mt={2}>
            <Typography variant='subtitle1' style={{ fontWeight: 600, marginBottom: 4 }}>ZIP Contents</Typography>
            <PaginatedSearchableTable<ZipEntry>
                rows={data.entries}
                columns={columns}
                searchFields={['fileName', 'path']}
                searchPlaceholder='Filter by file name or path…'
                rowActions={inspectablePaths.size > 0 ? rowActions : undefined}
                caption={caption}
                emptyMessage='No entries match your filter'
            />
        </Box>
    );
}

export default ZipContentsView;
