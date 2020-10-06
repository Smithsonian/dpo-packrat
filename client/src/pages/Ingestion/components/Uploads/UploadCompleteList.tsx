/* eslint-disable react-hooks/exhaustive-deps */
import { useQuery } from '@apollo/client';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect } from 'react';
import { FieldType } from '../../../../components';
import { parseAssetVersionToState, useUpload } from '../../../../store';
import { GetUploadedAssetVersionDocument } from '../../../../types/graphql';
import FileList from './FileList';
import UploadListHeader from './UploadListHeader';

const useStyles = makeStyles(({ palette, spacing }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        marginTop: 20,
        maxHeight: 'auto',
        width: '50vw',
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 80,
        maxHeight: '20vh',
        'overflow-y': 'auto',
        'overflow-x': 'hidden',
        width: '100%',
        '&::-webkit-scrollbar': {
            '-webkit-appearance': 'none'
        },
        '&::-webkit-scrollbar:vertical': {
            width: 12
        },
        '&::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            border: '2px solid white',
            backgroundColor: palette.text.disabled
        }
    },
    listDetail: {
        textAlign: 'center',
        color: palette.grey[500],
        fontStyle: 'italic',
        marginTop: spacing(4)
    },
}));

function UploadListComplete(): React.ReactElement {
    const classes = useStyles();

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