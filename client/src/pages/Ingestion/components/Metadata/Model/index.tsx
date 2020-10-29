/**
 * Metadata - Model
 *
 * This component renders the metadata fields specific to model asset.
 */
import { Box, Typography } from '@material-ui/core';
import React from 'react';
import { useMetadataStore } from '../../../../../store';

interface ModelProps {
    metadataIndex: number;
}

function Model(props: ModelProps): React.ReactElement {
    const { metadataIndex } = props;
    const metadata = useMetadataStore(state => state.metadatas[metadataIndex]);

    return (
        <Box display='flex' flex={1} alignItems='center' justifyContent='center'>
            <Typography variant='subtitle1' color='primary'>Metadata For Model {metadata.file.name}</Typography>
        </Box>
    );
}

export default Model;