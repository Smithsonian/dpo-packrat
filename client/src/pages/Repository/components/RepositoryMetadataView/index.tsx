import React from 'react';
import {
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        flex: 1,
        marginLeft: 10,
        border: `1px solid ${palette.primary.light}`,
        borderRadius: 10,
    },
    header: {
        position: 'sticky',
        top: 0,
        backgroundColor: palette.background.paper,
        color: palette.primary.contrastText
    },
    body: {
        overflow: 'auto'
    },
}));

function RepositoryMetadataView(): React.ReactElement {
    const classes = useStyles();
    const header: string[] = ['Project', 'Subject ID', 'Item Name'];

    return (
        <TableContainer className={classes.container}>
            <Table>
                <TableHead>
                    <TableRow>
                        {header.map((label, index) => <TableCell key={index} className={classes.header} align='left'>{label}</TableCell>)}
                    </TableRow>
                </TableHead>
                <TableBody className={classes.body}>
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default RepositoryMetadataView;
