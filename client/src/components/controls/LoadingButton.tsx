import { Button, ButtonProps, CircularProgress } from '@material-ui/core'; import React from 'react';

type LoadingButtonProps = ButtonProps & {
    loading: boolean;
    loaderSize?: number;
};

function LoadingButton(props: LoadingButtonProps): React.ReactElement {
    const { loading, loaderSize, ...rest } = props;

    return (
        <Button {...rest}>
            {!loading && props.children}
            {loading && <CircularProgress color='inherit' size={loaderSize || 20} />}
        </Button>
    );
}

export default LoadingButton;
