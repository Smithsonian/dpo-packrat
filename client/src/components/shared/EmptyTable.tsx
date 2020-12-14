/**
 * AssetDetailsTable
 *
 * This component renders asset details table tab for the DetailsTab component.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import Progress from './Progress';

export const useStyles = makeStyles(({ palette }) => ({
    empty: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        background: palette.secondary.light,
        padding: 40,
        borderRadius: 5
    }
}));

function EmptyTable(): React.ReactElement {
    const classes = useStyles();

    return (
        <Box className={classes.empty}>
            <Progress size={20} />
        </Box>
    );
}

export default EmptyTable;