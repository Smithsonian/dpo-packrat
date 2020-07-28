import { Button, ButtonProps, CircularProgress } from '@material-ui/core'; import React from 'react';

type LoadingButtonProps = ButtonProps & {
    loading: boolean;
    size?: number;
};

function LoadingButton(props: LoadingButtonProps): React.ReactElement {
    const { loading, size, children } = props;

    return (
        <Button {...props}>
            {!loading && children}
            {loading && <CircularProgress size={size || 10} />}
        </Button>
    );
}

export default LoadingButton;
