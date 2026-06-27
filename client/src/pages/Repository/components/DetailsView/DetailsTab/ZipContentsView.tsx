/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/display-name */
/**
 * ZipContentsView
 *
 * Lists the central-directory contents of a ZIP asset version. Calls the
 * REST endpoint /api/zip-contents/:idAssetVersion for the listing, and renders
 * an MUIDataTable styled to match AssetGrid / AssetVersionsTable for visual
 * consistency across the Details page tabs.
 *
 * Per-row actions:
 *   - Download (always available) — anchors to /api/zip-entry with download=1
 *     so the browser streams the entry as an attachment.
 *   - Preview (only when the asset version has a successful volumetric
 *     inspection and the entry path is a scan-sheet / scan-log) — opens the
 *     same endpoint with inline disposition in a new tab.
 *
 * Generic — works for any ZIP asset (volumetric, photogrammetry bulk, scene
 * archive, etc.). Currently embedded inline on the Asset Version detail page.
 */
import React, { useEffect, useState } from 'react';
import { Box, Tooltip, Typography } from '@material-ui/core';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { GetApp, Visibility } from '@material-ui/icons';
import MUIDataTable from 'mui-datatables';
import clsx from 'clsx';
import API from '../../../../../api';
import { DataTableOptions } from '../../../../../types/component';
import { useStyles } from './AssetGrid';

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

const COOKIE_NAME = 'ZipContentsColumns';

const DEFAULT_COLUMN_DISPLAY: Record<string, boolean> = {
    download: true,
    preview: true,
    fileName: true,
    path: true,
    size: true,
};

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Theme overrides — same shape as AssetGrid's `getMuiTheme`, with three
// deltas: (a) keep h6 visible so the "Zip Contents" title is shown in the
// toolbar, (b) render the title in the project's primary dark color, and
// (c) override the MUI search input background to white.
const getZipContentsTheme = () =>
    createMuiTheme({
        overrides: {
            MuiTableCell: {
                root: {
                    height: 'fit-content',
                    padding: '0px 3px',
                    margin: '1px',
                    fontSize: '0.8em',
                },
                body: { color: '#2C405A', borderBottomColor: 'rgb(255, 255, 224)', align: 'center' }
            },
            MuiToolbar: {
                regular: {
                    '@media (min-width: 600px)': {
                        minHeight: 'fit-content'
                    }
                },
                root: {
                    backgroundColor: 'rgb(255, 255, 224)',
                    borderTopRightRadius: '5px',
                    borderTopLeftRadius: '5px'
                }
            },
            MuiIconButton: {
                root: {
                    border: '0px',
                    padding: '4px'
                }
            },
            MuiTableHead: {
                root: {
                    borderBottom: '1.2px solid rgb(128,128,128)',
                    backgroundColor: 'rgb(255, 255, 224)',
                    '& button': {
                        padding: '0px 8px',
                        marginLeft: 0,
                        marginRight: 0
                    }
                }
            },
            MuiButtonBase: {
                root: {
                    '&:focus': {
                        outline: '0.5px hidden rgba(141, 171, 196, 0.4)'
                    },
                    outline: '0.1px hidden rgb(255, 255, 224)'
                }
            },
            MuiTypography: {
                h6: {
                    fontWeight: 600,
                    color: '#000000'
                }
            },
            MuiInput: {
                root: {
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #C9A227',
                    borderRadius: 4,
                    padding: '2px 6px'
                },
                underline: {
                    '&:before': { borderBottom: 'none' },
                    '&:after': { borderBottom: 'none' },
                    '&:hover:not(.Mui-disabled):before': { borderBottom: 'none' }
                }
            },
            // Pagination footer: paint the row, the cell, and the toolbar all in
            // the same light yellow as the header so there's no white gap on the
            // left of the row count / page controls.
            MuiTableFooter: {
                root: {
                    backgroundColor: 'rgb(255, 255, 224)'
                }
            },
            MuiTablePagination: {
                root: {
                    backgroundColor: 'rgb(255, 255, 224)',
                    borderBottomLeftRadius: '5px',
                    borderBottomRightRadius: '5px'
                },
                toolbar: {
                    backgroundColor: 'rgb(255, 255, 224)'
                }
            }
        }
    });

export function ZipContentsView({ idAssetVersion }: Props): JSX.Element {
    const classes = useStyles();
    const [data, setData] = useState<ZipContentsData | null>(null);
    const [inspectablePaths, setInspectablePaths] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [columnDisplay, setColumnDisplay] = useState<Record<string, boolean>>(loadColumnDisplay());

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

                // Best-effort: try to fetch inspection metadata so inspection-
                // flagged entries (scan sheets / logs) get a Preview action.
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

    const toggleColumn = (changedColumn: string, _action: string): void => {
        const next = { ...columnDisplay, [changedColumn]: !columnDisplay[changedColumn] };
        document.cookie = `${COOKIE_NAME}=${JSON.stringify(next)};path=/;max-age=630700000`;
        setColumnDisplay(next);
    };

    const showPreviewColumn = inspectablePaths.size > 0;

    const columns: any[] = [
        {
            name: 'download',
            label: ' ',
            options: {
                display: columnDisplay.download !== false,
                sort: false,
                viewColumns: false,
                setCellHeaderProps: () => ({ className: clsx({ [classes.centeredTableHead]: true }) }),
                setCellProps: () => ({ align: 'center' }),
                customBodyRenderLite: (dataIndex: number) => {
                    const row = data?.entries[dataIndex];
                    if (!row) return null;
                    return (
                        <Tooltip arrow title='Download this entry'>
                            <a
                                href={API.zipEntryUrl(idAssetVersion, row.path, true)}
                                className={classes.downloadIconLink}
                                aria-label={`Download ${row.fileName}`}
                            >
                                <GetApp fontSize='small' />
                            </a>
                        </Tooltip>
                    );
                }
            }
        },
        ...(showPreviewColumn ? [{
            name: 'preview',
            label: ' ',
            options: {
                display: columnDisplay.preview !== false,
                sort: false,
                viewColumns: false,
                setCellHeaderProps: () => ({ className: clsx({ [classes.centeredTableHead]: true }) }),
                setCellProps: () => ({ align: 'center' }),
                customBodyRenderLite: (dataIndex: number) => {
                    const row = data?.entries[dataIndex];
                    if (!row || !inspectablePaths.has(row.path)) return null;
                    return (
                        <Tooltip arrow title='Preview in browser'>
                            <a
                                href={API.zipEntryUrl(idAssetVersion, row.path)}
                                target='_blank'
                                rel='noopener noreferrer'
                                className={classes.downloadIconLink}
                                aria-label={`Preview ${row.fileName}`}
                            >
                                <Visibility fontSize='small' />
                            </a>
                        </Tooltip>
                    );
                }
            }
        }] : []),
        {
            name: 'fileName',
            label: 'File Name',
            options: {
                display: columnDisplay.fileName !== false,
                setCellProps: () => ({ align: 'left' })
            }
        },
        {
            name: 'path',
            label: 'Path',
            options: {
                display: columnDisplay.path !== false,
                setCellProps: () => ({ align: 'left' })
            }
        },
        {
            name: 'size',
            label: 'Size',
            options: {
                display: columnDisplay.size !== false,
                setCellHeaderProps: () => ({ className: clsx({ [classes.centeredTableHead]: true }) }),
                setCellProps: () => ({ align: 'center' }),
                customBodyRender: (value: number) => formatBytes(value)
            }
        }
    ];

    const options: DataTableOptions = {
        filter: false,
        responsive: 'standard',
        selectableRows: 'none',
        search: true,
        download: false,
        print: false,
        fixedHeader: false,
        pagination: true,
        rowsPerPage: 25,
        rowsPerPageOptions: [10, 25, 50, 100],
        elevation: 0,
        viewColumns: true,
        onViewColumnsChange: toggleColumn,
        setRowProps: (_row: any[], _dataIndex: number, rowIndex: number) => {
            return { className: rowIndex % 2 !== 0 ? classes.oddTableRow : classes.evenTableRow };
        }
    };

    if (loading)
        return <Box p={2}><Typography variant='body2' color='textSecondary'>Loading ZIP contents…</Typography></Box>;

    if (error)
        return <Box p={2}><Typography variant='body2' color='error'>ZIP contents unavailable: {error}</Typography></Box>;

    if (!data || data.entries.length === 0)
        return <Box p={2}><Typography variant='body2' color='textSecondary'>This ZIP appears to be empty.</Typography></Box>;

    const title: string = `Zip Contents — ${data.entryCount} entries · ${formatBytes(data.totalUncompressedSize)} uncompressed`;

    return (
        <MuiThemeProvider theme={getZipContentsTheme()}>
            <Box className={classes.tableContainer} mt={2}>
                <MUIDataTable
                    title={title}
                    data={data.entries}
                    columns={columns}
                    options={options as any}
                    className={classes.muiTable}
                />
            </Box>
        </MuiThemeProvider>
    );
}

function loadColumnDisplay(): Record<string, boolean> {
    const cookie = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`));
    if (!cookie) return { ...DEFAULT_COLUMN_DISPLAY };
    try {
        const parsed = JSON.parse(cookie.split('=')[1]);
        if (parsed && typeof parsed === 'object') return { ...DEFAULT_COLUMN_DISPLAY, ...parsed };
    } catch {
        // fall through to defaults
    }
    return { ...DEFAULT_COLUMN_DISPLAY };
}

export default ZipContentsView;
