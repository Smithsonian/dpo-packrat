import React from 'react';
import { Box, CircularProgress } from '@material-ui/core';

interface LoaderProps {
    size?: number;
    height?: number | string;
    minHeight?: number | string;
}

function Loader(props: LoaderProps): React.ReactElement {
    const { size, height, minHeight } = props;

    return (
        <Box
            display='flex'
            flex={1}
            alignItems='center'
            justifyContent='center'
            height={height || '100%'}
            minHeight={minHeight}
        >
            <CircularProgress color='primary' size={size} />
        </Box>
    );
}

export default Loader;
