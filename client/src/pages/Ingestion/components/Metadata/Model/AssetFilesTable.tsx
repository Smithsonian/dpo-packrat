/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography, Box } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    assetFilesTableContainer: {
        width: 'fit-content',
        minWidth: 400,
        borderRadius: 5,
        padding: 1,
        backgroundColor: theme.palette.secondary.light
    },
    headerRow: {
        borderBottom: '2px solid #D8E5EE',
        color: theme.palette.primary.dark
    },
    tableRow: {
        '&:not(:last-child)': {
            borderBottom: '2px solid #D8E5EE'
        },
        '& > *': {
            color: '#2C405A'
        }
    },
    assetNameCol: {
        width: '65%',
        color: '#2C405A'
    },
    assetTypeCol: {
        width: '35%',
        color: '#2C405A'
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
                                    <Typography variant='caption'>{row.assetName}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell>
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
