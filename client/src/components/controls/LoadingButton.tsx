/**
 * LoadingButton
 *
 * This is a button component that supports loading behavior.
 */
import { Button, ButtonProps } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';
import Progress from '../shared/Progress';

type LoadingButtonProps = ButtonProps & {
    loading: boolean;
    loaderSize?: number;
};

const useStyles = makeStyles(({ typography }) => ({
    button: {
        fontSize: typography.caption.fontSize,
        outline: '0.5px hidden rgba(141, 171, 196, 0.4)'
    }
}));

function LoadingButton(props: LoadingButtonProps): React.ReactElement {
    const { loading, loaderSize, className, ...rest } = props;
    const classes = useStyles();
    // console.log(`LoadingButton className=${className}, loading=${loading}`);

    return (
        <Button
            className={clsx(classes.button, className)}
            variant='contained'
            color='primary'
            disabled={loading}
            disableElevation
            {...rest}
        >
            {!loading && props.children}
            {loading && <Progress color='inherit' size={loaderSize || 20} />}
        </Button>
    );
}

export default LoadingButton;
