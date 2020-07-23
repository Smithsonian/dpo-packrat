import React from 'react';
import { Box, Typography, CircularProgress } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Check, Warning } from '@material-ui/icons';
import useUser from './hooks/useUser';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
}));

function Home(): React.ReactElement {
    const classes = useStyles();
    const { userLoading, userError } = useUser(0);

    let queryProgress = <CircularProgress color='primary' size={20} />;

    if (!userLoading && !userError) {
        queryProgress = (
            <>
                <Typography color='primary' variant='body1'>Server reachable</Typography>
                <Check color='primary' />
            </>
        );
    }

    if (userError) {
        queryProgress = (
            <>
                <Typography color='primary' variant='body1'>Server unreachable</Typography>
                <Warning htmlColor='red' />
            </>
        );
    }

    return (
        <Box className={classes.container}>
            <Typography color='primary' variant='h4'>Home</Typography>
            {queryProgress}
        </Box>
    );
}

export default Home;