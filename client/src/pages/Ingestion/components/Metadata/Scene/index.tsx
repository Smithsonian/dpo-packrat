/**
 * Metadata - Scene
 *
 * This component renders the metadata fields specific to scene asset.
 */
import { Box, Typography } from '@material-ui/core';
import React from 'react';
import { useMetadataStore } from '../../../../../store';

interface SceneProps {
    metadataIndex: number;
}

function Scene(props: SceneProps): React.ReactElement {
    const { metadataIndex } = props;
    const metadata = useMetadataStore(state => state.metadatas[metadataIndex]);

    return (
        <Box display='flex' flex={1} alignItems='center' justifyContent='center'>
            <Typography variant='subtitle1' color='primary'>Metadata For Scene {metadata.file.name}</Typography>
        </Box>
    );
}

export default Scene;