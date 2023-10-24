/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * UploadCompleteList
 *
 * This component renders upload list for completed files only.
 */
import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { parseAssetVersionToState, useUploadStore,  } from '../../../../store';
import { FieldType } from '../../../../components';
import FileList from './FileList';
import { makeStyles } from '@material-ui/core/styles';
import { scrollBarProperties } from '../../../../utils/shared';
import { Colors } from '../../../../theme';
import { Box, Typography } from '@material-ui/core';
import { FileUploadStatus } from '../../../../store';
//import { eIngestionMode } from '../../../../constants';
import { GetUploadedAssetVersionDocument } from '../../../../types/graphql';
import lodash from 'lodash';

const useStyles = makeStyles(({ palette /*, breakpoints*/ }) => ({
    container: {
        display: 'flex',
        flexBasis: '50%',
        flexDirection: 'column',
        //marginBottom: '50px'
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '12vh',
        //height: '30vh',
        'overflow-y': 'auto',
        'overflow-x': 'hidden',
        width: '100%',
        ...scrollBarProperties(true, false, palette.text.disabled)
    },
    listDetail: {
        //textAlign: 'center',
        color: palette.grey[500],
        fontStyle: 'italic',
        //marginTop: '8%'
        borderBottom: '1px solid #000'
    }
}));

interface ProcessingListProps {
    setUpdatedAssetVersionMetadata: (metadata: any) => void;
}

function ProcessingList(props: ProcessingListProps): React.ReactElement {
    const { setUpdatedAssetVersionMetadata } = props;
    const classes = useStyles();

    const { pending, loadProcessingFiles } = useUploadStore();
    const { data, loading, error, refetch } = useQuery(GetUploadedAssetVersionDocument);
    //console.log('Box 2 in use.');

    useEffect(() => {
        //PROCESSING
        if (data !== undefined) {
            const { getUploadedAssetVersion } = data;
            console.log('Processing List useQuery activated.');
            console.log(`Data: ${JSON.stringify(data)}`);
            const { AssetVersion, idAssetVersionsUpdated, UpdatedAssetVersionMetadata } = getUploadedAssetVersion;
            //console.log(`Processing: ${JSON.stringify(AssetVersion)}`);
            //console.log(AssetVersion);
            //console.log(`\t>>> COMPLETED ID Asset Versions Updated: ${JSON.stringify(idAssetVersionsUpdated)}`);
            //console.log(`\t>>> COMPLETED Updated Asset Version Metadata: ${JSON.stringify(UpdatedAssetVersionMetadata )}`);
            const fileIds: string[] = pending.map(({ id }) => id);
            const idAssetVersionsUpdatedSet = new Set(idAssetVersionsUpdated);
            //console.log(`UploadCompleteList useEffect UpdatedAssetVersionMetadata=${JSON.stringify(UpdatedAssetVersionMetadata)}; idAssetVersionsUpdated=${JSON.stringify(idAssetVersionsUpdated)}`);

            if (UpdatedAssetVersionMetadata && idAssetVersionsUpdated) {
                setUpdatedAssetVersionMetadata({ UpdatedAssetVersionMetadata, idAssetVersionsUpdatedSet });
            }
            const sortedAssetVersion = lodash.orderBy(AssetVersion, ['DateCreated'], ['desc']);
            if (!sortedAssetVersion)
                return;

            const UpdatedAssetVersionMetadataMap: Map<number, any> = new Map<number, any>();
            for (const updatedMetadata of UpdatedAssetVersionMetadata) {
                if (updatedMetadata.idAssetVersion)
                    UpdatedAssetVersionMetadataMap.set(updatedMetadata.idAssetVersion, updatedMetadata);
            }
            UpdatedAssetVersionMetadataMap.forEach((value: any, key: any) => {
                console.log(key, value);
            });

            const processingFiles = sortedAssetVersion.map(assetVersion => {
                const { idAssetVersion } = assetVersion;
                const id = String(idAssetVersion);
                const updatedMetadata = UpdatedAssetVersionMetadataMap.get(idAssetVersion);
                const updateMediaGroup: string | undefined = updatedMetadata && updatedMetadata.Item ? ` for Media Group ${updatedMetadata.Item.Name}` : undefined;
                const updateContext: string | undefined = updatedMetadata ? `(Updating ${updatedMetadata.UpdatedObjectName}${updateMediaGroup})` : undefined;

                if (fileIds.includes(id))
                    return pending.find(file => file.id === id) || assetVersion;

                const idAsset = idAssetVersionsUpdatedSet.has(idAssetVersion) ? assetVersion.Asset.idAsset : null;
                return parseAssetVersionToState(assetVersion, assetVersion.Asset.VAssetType, idAsset, updateContext);
            });

            loadProcessingFiles(processingFiles, refetch);
        }
    }, [data, loading, error]);


    let content: React.ReactNode = (
        <Typography className={classes.listDetail} variant='body1'>
            Fetching available files...
        </Typography>
    );


    //if(loading) {
    content = (
        <React.Fragment>
            {!pending.length && (
                <Typography className={classes.listDetail} variant='body1' >
                    No files available.
                </Typography>
            )}
            <FileList files={pending} showOnly={FileUploadStatus.PROCESSING} />
        </React.Fragment>
    );

    //}

    return (
        <>
            <Box className={classes.container}>
                <FieldType
                    required
                    align='left'
                    label='2. Validate Files'
                    labelTooltip='Select assets to ingest which belong to the same Subject &amp; Item'
                    labelProps={{ style: { fontSize: '1em', fontWeight: 500, margin: '1% 0px', color: Colors.defaults.dark, backgroundColor: 'none' } }}
                    //width={'calc(100% - 20px)'}
                    //padding='10px'
                >
                </FieldType>
                <Box>{content}</Box>
            </Box>
        </>
    );


}

export default ProcessingList;
