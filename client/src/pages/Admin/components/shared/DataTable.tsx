import React from 'react';
import MUIDataTable from 'mui-datatables';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { DataTableOptions } from '../../../../types/component';

const getMuiTheme = () =>
    createMuiTheme({
        overrides: {
            MuiTableCell: {
                root: {
                    height: 'fit-content',
                    padding: '0px 5px',
                    margin: '1px',
                    fontSize: '0.8em',
                },
                body: { color: '#2C405A', borderBottomColor: 'rgb(255, 255, 224)', align: 'center' }
            },
            MuiToolbar: {
                regular: {
                    // Note: this is to address the default height behavior at this width
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
                    padding: '0px'
                }
            },
            MuiTableHead: {
                root: {
                    borderBottom: '1.2px solid rgb(128,128,128)',
                    backgroundColor: 'rgb(255, 255, 224)',
                    '& button': {
                        padding: '0px 8px',
                        // Note: by default, these values are set so that header buttons are not horizontally aligned
                        // Set marginLeft and marginRight to 0 to center
                        marginLeft: 0,
                        marginRight: 0,
                        fontSize: '0.8rem'
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
                    display: 'none'
                }
            },
        }
    });


export const useStyles = makeStyles(({ palette }) => ({
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
    },
    emptyValue: {
        fontSize: '0.8em',
        color: palette.primary.dark,
        paddingTop: 10,
        paddingBottom: 5
    },
    tableContainer: {
        height: 'fit-content',
        backgroundColor: 'rgb(255, 255, 224)',
        paddingBottom: '3px',
        borderBottomLeftRadius: '5px',
        borderBottomRightRadius: '5px',
        // need to specify top radius in table container AND MuiToolbar override
        borderTopRightRadius: '5px',
        borderTopLeftRadius: '5px',
        width: 'fit-content',
        minWidth: '400px',
        outline: '1px solid rgba(141, 171, 196, 0.4)',
        borderRadius: 5
    },
}));


interface DataTableProps {
    title: string;
    data: any[];
    columns: any[];
    options: DataTableOptions;
}

function DataTable(props: DataTableProps): React.ReactElement {
    const { title, data, columns, options } = props;
    const classes = useStyles();

    return (
        <MuiThemeProvider theme={getMuiTheme()}>
            <Box className={classes.tableContainer}>
                {data.length > 0 && (
                    <MUIDataTable data={data} columns={columns} options={options} />
                )}
                {data.length === 0 && (
                    <Typography align='center' className={classes.emptyValue}>
                        No {title} found
                    </Typography>
                )}
            </Box>
        </MuiThemeProvider>
    );
}

export default DataTable;