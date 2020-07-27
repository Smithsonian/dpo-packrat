import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
}));

function Metadata(): React.ReactElement {
    const classes = useStyles();

    return (
        <Box className={classes.container}>
            <Typography variant='subtitle1'>Metadata</Typography>
        </Box>
    );
}

export default Metadata;