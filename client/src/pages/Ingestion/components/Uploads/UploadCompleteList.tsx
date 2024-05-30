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
import { Colors } from '../../../../theme';

const useStyles = makeStyles(({ palette /*, breakpoints*/ }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        margin: '0px 10px',
        // background: '0',
        // marginBottom: '1rem'
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '12vh',
        maxHeight: '25vh',
        'overflow-y': 'auto',
        'overflow-x': 'hidden',
        // width: '100%',
        padding: '0px 10px',
        ...scrollBarProperties(true, false, palette.text.disabled)
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

function UploadCompleteList(props: UploadListCompleteProps): React.ReactElement {
    const { setUpdatedAssetVersionMetadata } = props;
    const classes = useStyles();

    const { completed, loadCompleted } = useUploadStore();
    const { data, loading, error, refetch } = useQuery(GetUploadedAssetVersionDocument);

    useEffect(() => {
        if (!loading && !error) {
            const { getUploadedAssetVersion } = data;
            const { AssetVersion, idAssetVersionsUpdated, UpdatedAssetVersionMetadata } = getUploadedAssetVersion;

            const fileIds: string[] = completed.map(({ id }) => id);
            const idAssetVersionsUpdatedSet = new Set(idAssetVersionsUpdated);
            // console.log(`UploadCompleteList useEffect UpdatedAssetVersionMetadata=${JSON.stringify(UpdatedAssetVersionMetadata)}; idAssetVersionsUpdated=${JSON.stringify(idAssetVersionsUpdated)}`);

            if (UpdatedAssetVersionMetadata && idAssetVersionsUpdated)
                setUpdatedAssetVersionMetadata({ UpdatedAssetVersionMetadata, idAssetVersionsUpdatedSet });
            const sortedAssetVersion = lodash.orderBy(AssetVersion, ['DateCreated'], ['desc']);

            if (!sortedAssetVersion)
                return;

            const UpdatedAssetVersionMetadataMap: Map<number, any> = new Map<number, any>();
            for (const updatedMetadata of UpdatedAssetVersionMetadata) {
                if (updatedMetadata.idAssetVersion)
                    UpdatedAssetVersionMetadataMap.set(updatedMetadata.idAssetVersion, updatedMetadata);
            }

            const completedFiles = sortedAssetVersion.map(assetVersion => {
                const { idAssetVersion } = assetVersion;
                const id = String(idAssetVersion);
                const updatedMetadata = UpdatedAssetVersionMetadataMap.get(idAssetVersion);
                const updateMediaGroup: string | undefined = updatedMetadata && updatedMetadata.Item ? ` for Media Group ${updatedMetadata.Item.Name}` : undefined;
                const updateContext: string | undefined = updatedMetadata ? `(Updating ${updatedMetadata.UpdatedObjectName}${updateMediaGroup})` : undefined;

                if (fileIds.includes(id))
                    return completed.find(file => file.id === id) || assetVersion;

                const idAsset = idAssetVersionsUpdatedSet.has(idAssetVersion) ? assetVersion.Asset.idAsset : null;
                return parseAssetVersionToState(assetVersion, assetVersion.Asset.VAssetType, idAsset, updateContext);
            });

            loadCompleted(completedFiles, refetch);
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
                        No files available.
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
                label='Ready for Ingest'
                labelTooltip='Select assets to ingest which belong to the same Subject &amp; Item'
                labelProps={{ style: { fontSize: '1em', fontWeight: 500, margin: '1% 0px', color: Colors.defaults.dark } }}
                // width={'calc(100% - 20px)'}
            >
                <UploadListHeader />
                <Box className={classes.list}>{content}</Box>
            </FieldType>
        </Box>
    );
}

export default UploadCompleteList;
