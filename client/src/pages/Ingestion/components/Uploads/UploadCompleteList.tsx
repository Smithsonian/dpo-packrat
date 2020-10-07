/* eslint-disable react-hooks/exhaustive-deps */
import { useQuery } from '@apollo/client';
import { Box, Typography } from '@material-ui/core';
import React, { useEffect } from 'react';
import { FieldType } from '../../../../components';
import { parseAssetVersionToState, useUpload } from '../../../../store';
import { GetUploadedAssetVersionDocument } from '../../../../types/graphql';
import FileList from './FileList';
import { useUploadListStyles } from './UploadList';
import UploadListHeader from './UploadListHeader';

function UploadListComplete(): React.ReactElement {
    const classes = useUploadListStyles();

    const { completed, loadCompleted } = useUpload();
    const { data, loading, error } = useQuery(GetUploadedAssetVersionDocument);

    useEffect(() => {
        if (!loading && !error) {
            const { getUploadedAssetVersion } = data;
            const { AssetVersion } = getUploadedAssetVersion;
            const fileIds: string[] = completed.map(({ id }) => id);

            const completedFiles = AssetVersion.map(assetVersion => {
                const { idAssetVersion } = assetVersion;

                const id = String(idAssetVersion);

                if (fileIds.includes(id)) {
                    return completed.find(file => file.id === id);
                }
                return parseAssetVersionToState(assetVersion, assetVersion.Asset.VAssetType);
            });

            loadCompleted(completedFiles);
        }
    }, [data, loading, error]);

    let content: React.ReactNode = <Typography className={classes.listDetail} variant='body1'>Fetching available files...</Typography>;

    if (!loading) {
        content = (
            <React.Fragment>
                {!completed.length && <Typography className={classes.listDetail} variant='body1'>No files available</Typography>}
                <FileList files={completed} />
            </React.Fragment>
        );
    }

    return (
        <Box className={classes.container}>
            <FieldType required align='center' label='Uploaded Files: Select assets to ingest which belong to the same Subject &amp; Item'>
                <UploadListHeader />
                <Box className={classes.list}>
                    {content}
                </Box>
            </FieldType>
        </Box>

    );
}

export default UploadListComplete;