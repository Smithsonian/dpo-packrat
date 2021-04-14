/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography, Box } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    assetFilesTableContainer: {
        minWidth: '75%',
        width: '52vw',
        borderRadius: 5,
        padding: 10,
        backgroundColor: theme.palette.secondary.light
    },
    headerRow: {
        borderBottom: '3px solid #a9a9a9',
        color: theme.palette.primary.dark
    },
    tableRow: {
        '&:not(:last-child)': {
            borderBottom: '3px solid #D8E5EE'
        }
    },
    assetNameCol: {
        width: '65%'
    },
    assetTypeCol: {
        width: '35%'
    },
    assetRowData: {
        width: '75%',
        border: 'none',
        outline: 'none',
        padding: '0px 2px',
        paddingBottom: 2,
        paddingTop: 2,
        backgroundColor: 'transparent',
        fontSize: '12.8px',
        fontWeight: theme.typography.fontWeightRegular,
        fontFamily: theme.typography.fontFamily,
        '&:focus': {
            outline: 'none'
        },
        '&::placeholder': {
            fontStyle: 'italic'
        },
        '&::-moz-placeholder': {
            fontStyle: 'italic'
        }
    }
}));

function AssetFilesTable({ files }): React.ReactElement {
    const classes = useStyles();
    return (
        <Box className={classes.assetFilesTableContainer} mt={2} mb={2}>
            <Table>
                <TableHead>
                    <TableRow className={classes.headerRow}>
                        <TableCell className={classes.assetNameCol}>
                            <Typography variant='caption'>Asset Name</Typography>
                        </TableCell>
                        <TableCell className={classes.assetTypeCol}>
                            <Typography variant='caption'>Asset Type</Typography>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {files.map((row, ind) => (
                        <TableRow className={classes.tableRow} key={ind}>
                            <TableCell>
                                <Box component='div' overflow='visible' minWidth='10px'>
                                    <Typography className={classes.assetRowData}>{row.assetName}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Box component='div' overflow='visible'>
                                    <Typography className={classes.assetRowData}>{row.assetType}</Typography>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
}

export default AssetFilesTable;
