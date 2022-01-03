import React from 'react';
import MUIDataTable from 'mui-datatables';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { makeStyles } from '@material-ui/core/styles';
import { Box, TablePagination, Tooltip } from '@material-ui/core';
import { useWorkflowStore } from '../../../../store';
import { formatDate } from '../../../../utils/shared';
import SetIcon from '../../../../assets/images/Workflow_Set_Icon.svg';
import ReportIcon from '../../../../assets/images/Workflow_Report_Icon.svg';
import JobIcon from '../../../../assets/images/Workflow_Job_Icon.svg';
import { workflowListSortEnumToString } from '../../../../types/server';
import { ePaginationChange } from '../../../../store';
import { EmptyTable } from '../../../../components';
import { truncateWithEllipses } from '../../../../constants/helperfunctions';
import { DataTableOptions } from '../../../../types/component';
import { getDownloadValueForWorkflowReport, getDownloadValueForWorkflowSet, getDownloadValueForJob } from '../../../../utils/repository';
import API from '../../../../api';
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
        width: '80%'
    },
    centeredTableHead: {
        '& > span': {
            '& > button': {
                marginRight: 0,
                marginLeft: '0px'
            },
            justifyContent: 'center'
        }
    },
    container: {
        width: 'calc(100% + 10px)',
        background: palette.secondary.light,
        padding: 5,
        borderRadius: 5,
        marginBottom: 7
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
    }
}));

const getMuiTheme = () =>
    createMuiTheme({
        overrides: {
            MuiTableCell: {
                root: {
                    backgroundColor: '#FFFCD1',
                    height: 'fit-content',
                    padding: '1px',
                    fontSize: '0.8em'
                },
                body: { color: '#2C405A', borderBottomColor: '#FFFCD1', align: 'center' }
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
            MuiIconButton: {
                root: {
                    border: '0px',
                    padding: '0px'
                }
            },
            MuiTableHead: {
                root: {
                    borderBottom: '1.2px solid rgb(128,128,128)'
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
        rowsPerPageOptions: [10, 25, 100],
        sortOrder: { name: workflowListSortEnumToString(sortBy), direction: sortOrder ? 'asc' : 'desc' },
        onColumnSortChange: (changedColumn: string, direction: string) => paginationUpdateAndRefetchList(ePaginationChange.eSort, null, changedColumn, direction),
        customFooter: function Pagination() {
            return (
                <tfoot>
                    <tr>
                        <TablePagination
                            page={pageNumber}
                            rowsPerPage={rowCount}
                            count={count}
                            onChangeRowsPerPage={({ target: { value } }) => paginationUpdateAndRefetchList(ePaginationChange.eRowCount, Number(value), null, null)}
                            onChangePage={(_e, currentPage) => paginationUpdateAndRefetchList(ePaginationChange.ePage, currentPage, null, null)}
                        />
                    </tr>
                </tfoot>
            );
        }
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
            })
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
            name: 'DateStart',
            label: 'Start',
            options: {
                customBodyRender(value) {
                    if (!value) return '';
                    return formatDate(value);
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
                    return formatDate(value);
                },
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader
            }
        },
        {
            name: 'idWorkflowReport',
            label: 'Report',
            options: {
                customBodyRender(value) {
                    if (!value) return '';
                    return <WorkflowIcon reportType={eWorkflowLinkType.eReport} path={getDownloadValueForWorkflowReport(serverEndpoint, value)} />;
                },
                setCellProps: setCenterCell,
                setCellHeaderProps: setCenterHeader
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
                setCellHeaderProps: setCenterHeader
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
                setCellHeaderProps: setCenterHeader
            }
        }
    ];

    return (
        <MuiThemeProvider theme={getMuiTheme()}>
            <Box className={classes.tableContainer}>
                <MUIDataTable title='' data={rows} columns={columns} options={options} />
            </Box>
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
