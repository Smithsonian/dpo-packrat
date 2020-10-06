import React from 'react';
import { CircularProgress, CircularProgressProps } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
    container: {
        animationDuration: '750ms'
    }
}));

function Progress({ className, ...props }: CircularProgressProps): React.ReactElement {
    const classes = useStyles();

    return (
        <CircularProgress className={`${classes.container} ${className}`} color='primary' thickness={2} {...props} />
    );
}

export default Progress;
