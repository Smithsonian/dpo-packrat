/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography, Box } from '@material-ui/core';
import clsx from 'clsx';

const useStyles = makeStyles(() => ({
    assetFilesTableContainer: {
        width: 'fit-content',
        borderRadius: 5,
        padding: 1,
    },
    headerRow: {
        borderBottom: '2px solid #D8E5EE',
        backgroundColor: 'rgb(255, 255, 224)'
    },
    tableRow: {
    },
    assetNameCol: {
        color: '#2C405A'
    },
    assetTypeCol: {
        color: '#2C405A'
    },
    evenTableRow: {
        backgroundColor: 'rgb(255, 255, 224)'
    },
    oddTableRow: {
        backgroundColor: 'white'
    },
    table: {
        borderCollapse: 'collapse'
    },
    tableCell: {
        padding: '1px 10px'
    }
}));

function AssetFilesTable({ files }): React.ReactElement {
    const classes = useStyles();
    return (
        <Box className={classes.assetFilesTableContainer} mt={2} mb={2}>
            <Table className={classes.table}>
                <TableHead>
                    <TableRow className={classes.headerRow}>
                        <TableCell className={clsx(classes.assetNameCol, classes.tableCell)}>
                            <Typography variant='caption'>Asset Name</Typography>
                        </TableCell>
                        <TableCell className={clsx(classes.assetTypeCol, classes.tableCell)}>
                            <Typography variant='caption'>Asset Type</Typography>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {files.map((row, ind) => (
                        <TableRow className={ind % 2 !== 0 ? clsx(classes.tableRow, classes.oddTableRow) : clsx(classes.tableRow, classes.evenTableRow)} key={ind}>
                            <TableCell className={classes.tableCell}>
                                <Box component='div' overflow='visible' minWidth='10px'>
                                    <Typography variant='caption'>{row.assetName}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <Box component='div' overflow='visible'>
                                    <Typography variant='caption'>{row.assetType}</Typography>
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
