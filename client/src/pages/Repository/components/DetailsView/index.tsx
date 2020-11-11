/**
 * DetailsView
 *
 * This component renders repository details view for the Repository UI.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: 10,
        marginBottom: 20,
        borderRadius: 10,
        backgroundColor: palette.primary.light
    }
}));


function DetailsView(): React.ReactElement {
    const classes = useStyles();

    return (
        <Box className={classes.container}>

        </Box>
    );
}

export default DetailsView;