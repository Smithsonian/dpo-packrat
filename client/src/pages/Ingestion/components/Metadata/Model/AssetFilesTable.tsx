/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import DescriptionIcon from '@material-ui/icons/Description';
import Box from '@material-ui/core/Box';

const useStyles = makeStyles(theme => ({
    assetFilesTableContainer: {
        minWidth: '75%',
        width: 'auto',
        [theme.breakpoints.down('md')]: {
            width: '100%'
        },
        backgroundColor: theme.palette.secondary.light
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
        width: '65%'
    },
    assetTypeCol: {
        width: '35%'
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
                        <TableCell className={classes.assetTypeCol}>Asset Type</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {files.map((row, ind) => (
                        <TableRow className={classes.tableRow} key={ind}>
                            <TableCell>
                                <DescriptionIcon />
                            </TableCell>
                            <TableCell>
                                <Box component='div' overflow='visible' minWidth='10px'>
                                    <Typography>{row.assetName}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Box component='div' overflow='visible'>
                                    {row.assetType}
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
