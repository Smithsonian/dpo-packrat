import React from 'react';
import { Box } from '@material-ui/core';
import Progress from './Progress';

interface LoaderProps {
    size?: number;
    height?: number | string;
    minHeight?: number | string;
    maxWidth?: number | string;
}

function Loader(props: LoaderProps): React.ReactElement {
    const { size, height, minHeight, maxWidth } = props;

    return (
        <Box
            display='flex'
            flex={1}
            alignItems='center'
            justifyContent='center'
            height={height || '100%'}
            minHeight={minHeight}
            maxWidth={maxWidth}
        >
            <Progress size={size || 25} />
        </Box>
    );
}

export default Loader;
