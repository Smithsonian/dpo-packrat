import { CircularProgress, CircularProgressProps } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';

const useStyles = makeStyles(() => ({
    container: {
        animationDuration: '650ms'
    }
}));

function Progress({ className, ...props }: CircularProgressProps): React.ReactElement {
    const classes = useStyles();

    return (
        <CircularProgress className={clsx(classes.container, className)} color='primary' thickness={2} {...props} />
    );
}

export default Progress;
