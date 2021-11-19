/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * UploadCompleteList
 *
 * This component renders upload list for completed files only.
 */
import { useQuery } from '@apollo/client';
import { Box, Typography } from '@material-ui/core';
import React, { useEffect } from 'react';
import { FieldType } from '../../../../components';
import { parseAssetVersionToState, useUploadStore } from '../../../../store';
import { GetUploadedAssetVersionDocument } from '../../../../types/graphql';
import FileList from './FileList';
import { makeStyles } from '@material-ui/core/styles';
import { scrollBarProperties } from '../../../../utils/shared';
import UploadListHeader from './UploadListHeader';
import lodash from 'lodash';

const useStyles = makeStyles(({ palette /*, breakpoints*/ }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column'
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '16vh',
        height: '30vh',
        'overflow-y': 'auto',
        'overflow-x': 'hidden',
        width: '100%',
        ...scrollBarProperties(true, false, palette.text.disabled)
        // [breakpoints.down('lg')]: {
        //     minHeight: '20vh',
        //     maxHeight: '20vh'
        // }
    },
    listDetail: {
        textAlign: 'center',
        color: palette.grey[500],
        fontStyle: 'italic',
        marginTop: '8%'
    }
}));


interface UploadListCompleteProps {
    setUpdatedAssetVersionMetadata: (metadata: any) => void;
}

function UploadListComplete(props: UploadListCompleteProps): React.ReactElement {
    const { setUpdatedAssetVersionMetadata } = props;
    const classes = useStyles();

    const { completed, loadCompleted } = useUploadStore();
    const { data, loading, error } = useQuery(GetUploadedAssetVersionDocument);
    useEffect(() => {
        if (!loading && !error) {
            const { getUploadedAssetVersion } = data;
            const { AssetVersion, idAssetVersionsUpdated, UpdatedAssetVersionMetadata } = getUploadedAssetVersion;

            const fileIds: string[] = completed.map(({ id }) => id);
            const idAssetVersionsUpdatedSet = new Set(idAssetVersionsUpdated);

            if (UpdatedAssetVersionMetadata && idAssetVersionsUpdated)
                setUpdatedAssetVersionMetadata({ UpdatedAssetVersionMetadata,  idAssetVersionsUpdatedSet });
            const sortedAssetVersion = lodash.orderBy(AssetVersion, ['DateCreated'], ['desc']);

            if (!sortedAssetVersion) {
                return;
            }

            const completedFiles = sortedAssetVersion.map(assetVersion => {
                const { idAssetVersion } = assetVersion;

                const id = String(idAssetVersion);

                if (fileIds.includes(id)) {
                    return completed.find(file => file.id === id) || assetVersion;
                }

                let idAsset = null;
                if (idAssetVersionsUpdatedSet.has(idAssetVersion)) {
                    idAsset = assetVersion.Asset.idAsset;
                }
                return parseAssetVersionToState(assetVersion, assetVersion.Asset.VAssetType, idAsset);
            });

            loadCompleted(completedFiles);
        }
    }, [data, loading, error]);

    let content: React.ReactNode = (
        <Typography className={classes.listDetail} variant='body1'>
            Fetching available files...
        </Typography>
    );

    if (!loading) {
        content = (
            <React.Fragment>
                {!completed.length && (
                    <Typography className={classes.listDetail} variant='body1'>
                        No files available
                    </Typography>
                )}
                <FileList files={completed} />
            </React.Fragment>
        );
    }

    return (
        <Box className={classes.container}>
            <FieldType
                required
                align='center'
                label='Uploaded Files'
                labelTooltip='Select assets to ingest which belong to the same Subject &amp; Item'
                labelProps={{ style: { fontSize: '1em', fontWeight: 500, margin: '1% 0px', color: 'black' } }}
                width={'calc(100% - 20px)'}
            >
                <UploadListHeader />
                <Box className={classes.list}>{content}</Box>
            </FieldType>
        </Box>
    );
}

export default UploadListComplete;
