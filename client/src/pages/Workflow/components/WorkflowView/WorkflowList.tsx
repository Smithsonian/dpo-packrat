import React from 'react';
import MUIDataTable from 'mui-datatables';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { makeStyles } from '@material-ui/core/styles';
import { Box, TablePagination, Tooltip } from '@material-ui/core';
import WarningRoundedIcon from '@material-ui/icons/WarningRounded';
import { useWorkflowStore } from '../../../../store';
import { formatDateAndTime } from '../../../../utils/shared';
import SetIcon from '../../../../assets/images/Workflow_Set_Icon.svg';
import ReportIcon from '../../../../assets/images/Workflow_Report_Icon.svg';
import JobIcon from '../../../../assets/images/Workflow_Job_Icon.svg';
import { eWorkflowListSortColumns } from '@dpo-packrat/common';
import { ePaginationChange } from '../../../../store';
import { EmptyTable, NewTabLink } from '../../../../components';
import { truncateWithEllipses } from '../../../../constants/helperfunctions';
import { DataTableOptions } from '../../../../types/component';
import { getDownloadValueForWorkflowReport, getDownloadValueForWorkflowSet, getDownloadValueForJob, getDetailsUrlForObject } from '../../../../utils/repository';
import API from '../../../../api';
import WorkflowReportViewer, { WorkflowReportHeader } from './WorkflowReportViewer';
import { parseWorkflowSummary } from './workflowSummary';
import clsx from 'clsx';

interface WorkflowIconProps {
    reportType: eWorkflowLinkType;
    path: string;
}

export enum eWorkflowLinkType {
    eReport,
    eSet,
    eJob
}

export const useStyles = makeStyles(({ palette }) => ({
    tableContainer: {
        backgroundColor: palette.secondary.light,
        marginBottom: '5px',
        borderBottomLeftRadius: '5px',
        borderBottomRightRadius: '5px',
        // need to specify top radius in table container AND MuiToolbar override
        borderTopRightRadius: '5px',
        borderTopLeftRadius: '5px',
        border: '1px solid #e0e0e0',
        width: '100%',
        overflowX: 'auto'
    },
    centeredTableHead: {
        '& > span': {
            '& > button': {
                marginRight: 0,
                marginLeft: '0px',
                '&:focus': {
                    outline: '0.5px solid #8DABC4'
                }
            },
            justifyContent: 'center'
        }
    },

    header: {
        fontSize: '0.9em',
        color: palette.primary.dark,
        fontWeight: 'bold'
    },
    value: {
        fontSize: '0.8em',
        color: palette.primary.dark
    },
    empty: {
        height: '400px',
        width: '80%'
    },
    link: {
        textDecoration: 'underline'
    },
    footerBtn: {
        '&:focus': {
            outline: '0.5px solid #8DABC4'
        }
    }
}));

const getMuiTheme = () =>
    createMuiTheme({
        overrides: {
            MuiTableCell: {
                root: {
                    backgroundColor: 'inherit',
                    height: 'fit-content',
                    padding: '8px',
                    fontSize: '0.8em'
                },
                head: {
                    backgroundColor: 'transparent'
                },
                body: { color: '#2C405A', align: 'center' }
            },
            MuiTableBody: {
                root: {
                    '& tr:nth-of-type(odd)': {
                        backgroundColor: '#FFFCD1'
                    },
                    '& tr:nth-of-type(even)': {
                        backgroundColor: '#FFF9BE'
                    }
                }
            },
            MuiToolbar: {
                regular: {
                    // this is to address the default height behavior at this width
                    '@media (min-width: 600px)': {
                        minHeight: 'fit-content'
                    }
                },
                root: {
                    backgroundColor: '#FFFCD1',
                    borderTopRightRadius: '5px',
                    borderTopLeftRadius: '5px'
                }
            },
            MuiTableFooter: {
                root: {
                    backgroundColor: '#FFFCD1'
                }
            },
            MuiTablePagination: {
                root: {
                    backgroundColor: '#FFFCD1',
                    borderBottomLeftRadius: '5px',
                    borderBottomRightRadius: '5px'
                },
                toolbar: {
                    backgroundColor: '#FFFCD1'
                }
            },
            MuiIconButton: {
                root: {
                    border: '0px',
                    padding: '0px'
                }
            },
            MuiTableHead: {
                root: {
                    backgroundColor: '#f7f29c',
                    borderBottom: '1.2px solid rgb(128,128,128)'
                }
            },
            MuiInputBase: {
                input: {
                    '&:-webkit-autofill': {
                        animationDuration: '4s'
                    },
                    '&:focus': {
                        outline: '0.5px solid #8DABC4',
                    }
                }
            },
            MuiButtonBase: {
                root: {
                    outline: 'none'
                }
            }
        }
    });

function WorkflowList(): React.ReactElement {
    const classes = useStyles();
    const [rows, rowCount, sortBy, sortOrder, pageNumber, loading, paginationUpdateAndRefetchList] = useWorkflowStore(state => [
        state.workflowRowData,
        state.rowCount,
        state.sortBy,
        state.sortOrder,
        state.pageNumber,
        state.loading,
        state.paginationUpdateAndRefetchList
    ]);

    const calculateTotalRowCount = (): number => {
        if (pageNumber === 0 && rows.length < rowCount) {
            return rows.length;
        } else if (rows.length < rowCount) {
            return pageNumber * rowCount + rows.length;
        }
        return -1;
    };

    const count = calculateTotalRowCount();

    const [reportViewer, setReportViewer] = React.useState<{ open: boolean; url: string; header: WorkflowReportHeader; mimeType: string | null }>({ open: false, url: '', header: { title: '' }, mimeType: null });

    const options: DataTableOptions = {
        filter: false,
        filterType: 'dropdown',
        responsive: 'standard',
        selectableRows: 'none',
        search: false,
        download: false,
        print: false,
        fixedHeader: false,
        pagination: false,
        elevation: 0,
        viewColumns: false,
        rowsPerPage: rowCount,
        rowsPerPageOptions: [50, 100],
        sortOrder: { name: workflowListSortEnumToString(sortBy), direction: sortOrder ? 'asc' : 'desc' },
        onColumnSortChange: (changedColumn: string, direction: string) => paginationUpdateAndRefetchList(ePaginationChange.eSort, null, changedColumn, direction),
        customTableBodyFooterRender: function Pagination() {
            return (
                <tfoot>
                    <tr>
                        <TablePagination
                            page={pageNumber}
                            rowsPerPage={rowCount}
                            count={count}
                            onChangeRowsPerPage={({ target: { value } }) => paginationUpdateAndRefetchList(ePaginationChange.eRowCount, Number(value), null, null)}
                            onChangePage={(_e, currentPage) => paginationUpdateAndRefetchList(ePaginationChange.ePage, currentPage, null, null)}
                            backIconButtonProps={{ className: classes.footerBtn }}
                            nextIconButtonProps={{ className: classes.footerBtn }}
                            rowsPerPageOptions={[50, 100]}
                        />
                    </tr>
                </tfoot>
            );
        },
        setRowProps: () => {
            return { role: 'row' };
        },
        // setTableProps: () => {}
    };

    const serverEndpoint = API.serverEndpoint();

    if (loading) {
        return (
            <Box className={classes.empty}>
                <EmptyTable />
            </Box>
        );
    }

    const setCenterHeader = () => {
        return {
            className: clsx({
                [classes.centeredTableHead]: true
            }),
        };
    };

    const setCenterCell = () => ({ align: 'center' });

    const columns = [
        {
            name: 'idWorkflowSet',
            label: 'Set',
            options: {
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader
            }
        },
        {
            name: 'Type',
            label: 'Type',
            options: {
                // setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader
            }
        },
        {
            name: 'State',
            label: 'State',
            options: {
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader
            }
        },
        {
            name: 'Owner',
            label: 'Owner',
            options: {
                customBodyRender(value) {
                    if (!value) return '';
                    return value.Name;
                },
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader
            }
        },
        {
            name: 'ProjectName',
            label: 'Project',
            options: {
                customBodyRender(value) {
                    if (!value) return '';
                    return (
                        <Tooltip placement='top' title={value} arrow>
                            <div style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {value}
                            </div>
                        </Tooltip>
                    );
                },
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader
            }
        },
        {
            name: 'Object',
            label: 'Object',
            options: {
                sort: false,
                customBodyRenderLite(dataIndex) {
                    const summary = parseWorkflowSummary(rows[dataIndex]);
                    if (!summary) return '';
                    const label = summary.scene || summary.subject || summary.mediaGroup || '';
                    const type = summary.idScene ? 'Scene' : (summary.idModel ? 'Model' : (summary.idSubject ? 'Subject' : 'Object'));
                    const id = summary.idSystemObject;
                    // The input file fed to the job (uploaded zip / mesh / svx), shown as a basename so a
                    // pre-ingest inspect row still says what it acted on, even with no object to link.
                    const fileName: string = summary.input ? (summary.input.split(/[\\/]/).pop() ?? '') : '';
                    const fileLine = fileName
                        ? <div title={summary.input ?? ''} style={{ fontSize: '0.75em', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>{truncateWithEllipses(fileName, 34)}</div>
                        : null;
                    if (id) {
                        const full = `[${type}] ${label || `Object ${id}`}`;
                        return (
                            <span>
                                <Tooltip placement='top' title={full} arrow>
                                    <span>
                                        <NewTabLink to={getDetailsUrlForObject(id)} className={classes.link}>{truncateWithEllipses(full, 30)}</NewTabLink>
                                    </span>
                                </Tooltip>
                                {fileLine}
                            </span>
                        );
                    }
                    if (label)
                        return (
                            <span>
                                <Tooltip placement='top' title={`[${type}] ${label}`} arrow>
                                    <div style={{ maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{`[${type}] ${label}`}</div>
                                </Tooltip>
                                {fileLine}
                            </span>
                        );
                    // No linkable object yet (pre-ingest upload/inspect) — show the filename as the value.
                    return fileName
                        ? <Tooltip placement='top' title={summary.input ?? ''} arrow><div style={{ maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{truncateWithEllipses(fileName, 30)}</div></Tooltip>
                        : '';
                },
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader
            }
        },
        {
            name: 'DateStart',
            label: 'Start',
            options: {
                customBodyRender(value) {
                    if (!value) return '';
                    return formatDateAndTime(value);
                },
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader
            }
        },
        {
            name: 'DateLast',
            label: 'Last',
            options: {
                customBodyRender(value) {
                    if (!value) return '';
                    return formatDateAndTime(value);
                },
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader
            }
        },
        {
            name: 'idWorkflowReport',
            label: 'Report',
            options: {
                customBodyRenderLite(dataIndex) {
                    const row = rows[dataIndex];
                    const value = row?.idWorkflowReport;
                    if (!value) return '';
                    const url = getDownloadValueForWorkflowReport(serverEndpoint, value);
                    const summary = parseWorkflowSummary(row);
                    const header: WorkflowReportHeader = {
                        title: summary?.scene || summary?.subject || row.Type || `Report #${value}`,
                        recipe: summary?.recipe ?? undefined,
                        cookJobId: summary?.cookJobId ?? undefined,
                        cookServer: summary?.cookServer ?? undefined,
                        started: row.DateStart ? formatDateAndTime(row.DateStart) : undefined
                    };
                    return (
                        <button
                            type='button'
                            onClick={() => setReportViewer({ open: true, url, header, mimeType: row.ReportMimeType ?? null })}
                            aria-label='Open workflow report'
                            style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', display: 'flex', justifyContent: 'center', width: '100%' }}
                        >
                            <img src={ReportIcon} style={{ height: '20px', width: '20px' }} alt='This icon indicates a clickable report.' />
                        </button>
                    );
                },
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader,
                sort: false
            }
        },
        {
            name: 'idWorkflowSet',
            label: 'Set',
            options: {
                customBodyRender(value) {
                    if (!value) return '';
                    return <WorkflowIcon reportType={eWorkflowLinkType.eSet} path={getDownloadValueForWorkflowSet(serverEndpoint, value)} />;
                },
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader,
                sort: false
            }
        },
        {
            name: 'idJobRun',
            label: 'Job',
            options: {
                customBodyRender(value) {
                    if (!value) return '';
                    return <WorkflowIcon reportType={eWorkflowLinkType.eJob} path={getDownloadValueForJob(serverEndpoint, value)} />;
                },
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader,
                sort: false
            }
        },
        {
            name: 'Warnings',
            label: 'Warn',
            options: {
                sort: false,
                customBodyRenderLite(dataIndex) {
                    const summary = parseWorkflowSummary(rows[dataIndex]);
                    const count = summary?.warnings ?? 0;
                    if (!count) return '';
                    const title = `${count} non-blocking warning${count === 1 ? '' : 's'} — open the report for details`;
                    return (
                        <Tooltip placement='left' title={title} arrow>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#b26a00' }}>
                                <WarningRoundedIcon style={{ fontSize: 18 }} />
                                {count > 1 ? count : ''}
                            </span>
                        </Tooltip>
                    );
                },
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader
            }
        },
        {
            name: 'Error',
            label: 'Error',
            options: {
                customBodyRender(value) {
                    if (!value) return '';
                    return (
                        <Tooltip placement='left' title={value} arrow>
                            <div>{truncateWithEllipses(value, 40)}</div>
                        </Tooltip>
                    );
                },
                // setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader,
                sort: false
            }
        }
    ];

    return (
        <MuiThemeProvider theme={getMuiTheme()}>
            <Box className={classes.tableContainer}>
                <MUIDataTable title='' data={rows} columns={columns} options={options} />
            </Box>
            <WorkflowReportViewer
                open={reportViewer.open}
                onClose={() => setReportViewer({ open: false, url: '', header: { title: '' }, mimeType: null })}
                reportUrl={reportViewer.url}
                header={reportViewer.header}
                mimeType={reportViewer.mimeType}
            />
        </MuiThemeProvider>
    );
}

export default WorkflowList;

function WorkflowIcon(props: WorkflowIconProps): React.ReactElement {
    const { reportType, path } = props;

    let source = '';
    if (reportType === eWorkflowLinkType.eJob) source = JobIcon;
    if (reportType === eWorkflowLinkType.eReport) source = ReportIcon;
    if (reportType === eWorkflowLinkType.eSet) source = SetIcon;

    return (
        <a
            href={path}
            style={{ display: 'flex', justifyContent: 'center' }}
            target='_blank'
            rel='noreferrer noopener'
        >
            <img src={source} style={{ height: '20px', width: '20px' }} alt='This icon indicates a clickable hyperlink.' />
        </a>
    );
}

const workflowListSortEnumToString = (col: eWorkflowListSortColumns): string => {
    switch (col) {
        case eWorkflowListSortColumns.eType: return 'Type';
        case eWorkflowListSortColumns.eState: return 'State';
        case eWorkflowListSortColumns.eOwner: return 'Owner';
        case eWorkflowListSortColumns.eProject: return 'ProjectName';
        case eWorkflowListSortColumns.eStart: return 'DateStart';
        case eWorkflowListSortColumns.eLast: return 'DateLast';
        case eWorkflowListSortColumns.eReport: return 'idWorkflowReport';
        case eWorkflowListSortColumns.eJobRun: return 'idJobRun';
        case eWorkflowListSortColumns.eError: return 'Error';
        case eWorkflowListSortColumns.eSet: return 'idWorkflowSet';
        default: return 'idWorkflowSet';
    }
};