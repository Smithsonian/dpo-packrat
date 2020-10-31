/**
 * Metadata - Other
 *
 * This component renders the metadata fields for other asset types.
 */
import { Box, Typography } from '@material-ui/core';
import React from 'react';
import { useMetadataStore } from '../../../../../store';

interface OtherProps {
    readonly metadataIndex: number;
}

function Other(props: OtherProps): React.ReactElement {
    const { metadataIndex } = props;
    const metadata = useMetadataStore(state => state.metadatas[metadataIndex]);

    return (
        <Box display='flex' flex={1} alignItems='center' justifyContent='center'>
            <Typography variant='subtitle1' color='primary'>Metadata Not yet implemented for {metadata.file.name}</Typography>
        </Box>
    );
}

export default Other;