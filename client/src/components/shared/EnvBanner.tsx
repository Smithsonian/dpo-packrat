/**
 * EnvBanner
 *
 * This component renders banner for the environment the app is running.
 */
import { Box, Typography } from '@material-ui/core';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import React from 'react';

const useStyles = makeStyles(({ palette /*, typography*/ }) => createStyles({
    container: {
        display: 'flex',
        position: 'fixed',
        zIndex: 100,
        backgroundColor: palette.primary.main,
        padding: 10,
        right: 0,
        bottom: 0,
        borderTopLeftRadius: 5,
        color: palette.background.paper
    },
    content: {
        fontWeight: 500
    }
}));

interface EnvBannerProps {
    renderFor: string[];
}

function EnvBanner(props: EnvBannerProps): React.ReactElement | null {
    const { renderFor } = props;
    const classes = useStyles();

    const env = process.env.NODE_ENV;

    if (!renderFor.includes(env)) return null;

    return (
        <Box className={classes.container}>
            <Typography className={classes.content} color='inherit' variant='caption'>{env.toUpperCase()}</Typography>
        </Box>
    );
}

export default EnvBanner;
