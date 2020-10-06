import React from 'react';
import { Button, ButtonProps } from '@material-ui/core';
import Progress from '../shared/Progress';

type LoadingButtonProps = ButtonProps & {
    loading: boolean;
    loaderSize?: number;
};

function LoadingButton(props: LoadingButtonProps): React.ReactElement {
    const { loading, loaderSize, ...rest } = props;

    return (
        <Button {...rest}>
            {!loading && props.children}
            {loading && <Progress color='inherit' size={loaderSize || 20} />}
        </Button>
    );
}

export default LoadingButton;
