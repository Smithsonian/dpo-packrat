import React from 'react';
import { Button, ButtonProps } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Progress from '../shared/Progress';

type LoadingButtonProps = ButtonProps & {
    loading: boolean;
    loaderSize?: number;
};

const useStyles = makeStyles(({ typography }) => ({
    button: {
        fontSize: typography.caption.fontSize
    }
}));

function LoadingButton(props: LoadingButtonProps): React.ReactElement {
    const { loading, loaderSize, className, ...rest } = props;
    const classes = useStyles();

    return (
        <Button className={`${classes.button} ${className}`} variant='contained' color='primary' {...rest}>
            {!loading && props.children}
            {loading && <Progress color='inherit' size={loaderSize || 20} />}
        </Button>
    );
}

export default LoadingButton;
