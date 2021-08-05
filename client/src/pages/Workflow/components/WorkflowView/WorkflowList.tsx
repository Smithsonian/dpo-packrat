import React from 'react';
import MUIDataTable from 'mui-datatables';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { makeStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import { useWorkflowStore } from '../../../../store';
import { formatDate } from '../../../../utils/shared';
import SetIcon from '../../../../assets/images/Workflow_Set_Icon.svg';
import ReportIcon from '../../../../assets/images/Workflow_Report_Icon.svg';
import JobIcon from '../../../../assets/images/Workflow_Job_Icon.svg';

export const useStyles = makeStyles(({ palette }) => ({
    tableContainer: {
        height: 'fit-content',
        backgroundColor: palette.secondary.light,
        paddingBottom: '5px',
        borderBottomLeftRadius: '5px',
        borderBottomRightRadius: '5px',
        // need to specify top radius in table container AND MuiToolbar override
        borderTopRightRadius: '5px',
        borderTopLeftRadius: '5px',
        width: 'fit-content'
    },
    centeredTableHead: {
        '& > span': {
            justifyContent: 'center'
        }
    },
    container: {
        width: '100%',
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        background: palette.secondary.light,
        padding: 40,
        borderRadius: 5
    },
    link: {
        textDecoration: 'underline'
    }
}));

interface DataTableOptions {
    filter?: boolean;
    filterType?: string;
    responsive?: string;
    selectableRows?: string;
    search?: boolean;
    download?: boolean;
    print?: boolean;
    fixedHeader?: boolean;
    pagination?: boolean;
    elevation?: number;
    viewColumns?: boolean;
    onViewColumnsChange?: (change: string, action: string) => void;
}

interface WorkflowIconProps {
    reportType: eWorkflowLinkType;
    path: string;
}

export enum eWorkflowLinkType {
    eReport,
    eSet,
    eJob
}

const getMuiTheme = () =>
    createMuiTheme({
        overrides: {
            MuiTableCell: {
                root: {
                    backgroundColor: '#FFFCD1',
                    height: 'fit-content',
                    paddingLeft: '1px',
                    paddingRight: '1px',
                    paddingTop: '0px',
                    paddingBottom: '0px',
                    margin: '1px',
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
    const [rows] = useWorkflowStore(state => [state.workflowRowData]);

    // const toggleColumn = (changedColumn: string, _action: string) => {
    //     const assetColumnsCopy = [...assetColumns];
    //     const column = assetColumnsCopy.find(col => col.field === changedColumn);
    //     if (column) {
    //         column.options.hide = !column.options.hide;
    //         setAssetColumns(assetColumnsCopy);
    //     }
    // };

    /*
    DateLast: "2021-08-03T22:23:53+00:00"
    DateStart: "2021-08-03T22:23:53+00:00"
    Error: null
    HyperlinkJob: null
    HyperlinkReport: "https://packrat.si.edu:8443/server/download?idWorkflowReport=3"
    HyperlinkSet: "https://packrat.si.edu:8443/server/download?idWorkflowSet=3"
    Owner: {Name: "Shin Tung", __typename: "User"}
    State: "Done"
    Type: "Upload"
    idJobRun: null
    idWorkflow: 3
    idWorkflowReport: 3
    idWorkflowSet: 3
    */

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
        viewColumns: false
        // onViewColumnsChange: toggleColumn
    };

    const columns = [
        {
            name: 'idWorkflowSet',
            label: 'Set',
            options: {}
        },
        {
            name: 'Type',
            label: 'Type',
            options: {}
        },
        {
            name: 'State',
            label: 'State',
            options: {}
        },
        {
            name: 'Owner',
            label: 'Owner',
            options: {
                customBodyRender(value) {
                    return value.Name;
                }
            }
        },
        {
            name: 'DateStart',
            label: 'Start',
            options: {
                customBodyRender(value) {
                    return formatDate(value);
                }
            }
        },
        {
            name: 'DateLast',
            label: 'Last',
            options: {
                customBodyRender(value) {
                    return formatDate(value);
                }
            }
        },
        {
            name: 'HyperlinkReport',
            label: 'Report',
            options: {
                sort: false,
                customBodyRender(value) {
                    if (!value) return '';
                    return <WorkflowIcon reportType={eWorkflowLinkType.eReport} path={value} />;
                },
                setCellProps: () => ({ align: 'center' })
            }
        },
        {
            name: 'HyperlinkSet',
            label: 'Set',
            options: {
                sort: false,
                customBodyRender(value) {
                    if (!value) return '';
                    return <WorkflowIcon reportType={eWorkflowLinkType.eSet} path={value} />;
                }
            }
        },
        {
            name: 'HyperlinkJob',
            label: 'Job',
            options: {
                sort: false,
                customBodyRender(value) {
                    if (!value) return '';
                    return <WorkflowIcon reportType={eWorkflowLinkType.eJob} path={value} />;
                }
            }
        },
        {
            name: 'Error',
            label: 'Error',
            options: {
                sort: false,
                customBodyRender(value) {
                    if (!value) return '';
                    return value[0];
                }
            }
        }
    ];
    // add a day, convert to utc and then send the days

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
        <a href={path} style={{ display: 'flex' }}>
            <img src={source} style={{ height: '20px', width: '20px' }} />
        </a>
    );
}
