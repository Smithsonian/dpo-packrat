/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import DescriptionIcon from '@material-ui/icons/Description';
import Box from '@material-ui/core/Box';

const useStyles = makeStyles(({ palette }) => ({
    assetFilesTableContainer: {
        width: '75%',
        backgroundColor: palette.secondary.light
    },
    headerRow: {
        borderBottom: '3px solid #a9a9a9'
    },
    tableRow: {
        '&:not(:last-child)': {
            borderBottom: '3px solid #D8E5EE'
        }
    },
    iconCol: {
        width: '20px'
    },
    assetNameCol: {
        width: '30%'
    }
}));

function AssetFilesTable({ files }): React.ReactElement {
    const classes = useStyles();
    return (
        <Box className={classes.assetFilesTableContainer} mt={2} mb={2}>
            <Table>
                <TableHead>
                    <TableRow className={classes.headerRow}>
                        <TableCell className={classes.iconCol}></TableCell>
                        <TableCell className={classes.assetNameCol}>Asset Name</TableCell>
                        <TableCell>Asset Type</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {files.map((row, ind) => (
                        <TableRow className={classes.tableRow} key={ind}>
                            <TableCell>
                                <DescriptionIcon />
                            </TableCell>
                            <TableCell>{row.assetName}</TableCell>
                            <TableCell>{row.assetType}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
}

export default AssetFilesTable;
