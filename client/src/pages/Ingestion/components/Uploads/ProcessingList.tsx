/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * UploadCompleteList
 *
 * This component renders upload list for completed files only.
 */
import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useUploadStore } from '../../../../store';
import { FieldType } from '../../../../components';
import FileList from './FileList';
import { makeStyles } from '@material-ui/core/styles';
import { scrollBarProperties } from '../../../../utils/shared';
import { Colors } from '../../../../theme';
import { Box, Typography } from '@material-ui/core';
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
        textAlign: 'center',
        color: palette.grey[500],
        fontStyle: 'italic',
        marginTop: '8%'
    }
}));

function ProcessingList(): React.ReactElement {
    const classes = useStyles();
    const { filesTransferring, getFilesTransferring } = useUploadStore();
    const { data, loading, error, refetch } = useQuery(GetUploadedAssetVersionDocument);

    useEffect(() => {
        if (!loading && !error) {
            const { getUploadedAssetVersion } = data;
            const { AssetVersion } = getUploadedAssetVersion;
            const fileIds: string[] = filesTransferring.map(({ id }) => id);
            const sortedAssetVersion = lodash.orderBy(AssetVersion, ['DateCreated'], ['desc']);
            if (!sortedAssetVersion)
                return;

            const transferredFiles = sortedAssetVersion.map(assetVersion => {
                const { idAssetVersion } = assetVersion;
                const id = String(idAssetVersion);

                if (fileIds.includes(id))
                    return filesTransferring.find(file => file.id === id) || assetVersion;
            });

            getFilesTransferring( transferredFiles );
        }
    }, [data, loading, error, refetch]);

    let content: React.ReactNode = (
        <Typography className={classes.listDetail} variant='body1'>
            Fetching available files...
        </Typography>
    );

    if(!loading) {
        content = (
            <React.Fragment>
                {!filesTransferring.length && (
                    <Typography className={classes.listDetail} variant='body1' >
                        No files available.
                    </Typography>
                )}
                <FileList files={filesTransferring} />
            </React.Fragment>
        );

    }

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
