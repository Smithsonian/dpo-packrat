import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
}));

function About(): React.ReactElement {
    const classes = useStyles();

    return (
        <Box className={classes.container}>
            <Typography color='primary' variant='h4'>About</Typography>
        </Box>
    );
}

export default About;