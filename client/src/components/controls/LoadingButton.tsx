import { Button, ButtonProps, CircularProgress } from '@material-ui/core'; import React from 'react';

type LoadingButtonProps = ButtonProps & {
    loading: boolean;
    size?: number;
};

function LoadingButton(props: LoadingButtonProps): React.ReactElement {
    const { loading, size, ...rest } = props;

    return (
        <Button {...rest} >
            {!loading && props.children}
            {loading && <CircularProgress color='inherit' size={size || 20} />}
        </Button>
    );
}

export default LoadingButton;
