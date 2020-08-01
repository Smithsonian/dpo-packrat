import React, { useContext, useCallback } from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { AppContext, TRANSFER_ACTIONS, INGESTION_TRANSFER_STATUS, FileId, IngestionFile, IngestionDispatchAction, AssetType } from '../../../../context';
import FileUploadListItem from './FileUploadListItem';
import { AnimatePresence } from 'framer-motion';
import { FieldType } from '../../../../components';

const useStyles = makeStyles(({ palette, typography }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        marginTop: 20,
        maxHeight: '40vh',
        width: '50vw',
        overflow: 'auto',
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
    header: {
        display: 'flex',
        alignItems: 'center',
        height: 50,
        width: '100%',
        borderRadius: 5,
        background: palette.background.paper,
    },
    fileDetails: {
        display: 'flex',
        flex: 2,
        paddingLeft: 20
    },
    size: {
        display: 'flex',
        flex: 1,
    },
    assetType: {
        display: 'flex',
        flex: 2
    },
    label: {
        color: palette.primary.contrastText,
        fontWeight: typography.fontWeightRegular
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: 70,
        width: '100%',
    },
    emptyListLabel: {
        textAlign: 'center',
        color: palette.grey[500],
        fontStyle: 'italic'
    },
}));

function FileUploadList(): React.ReactElement {
    const classes = useStyles();
    const { ingestion, ingestionDispatch } = useContext(AppContext);
    const { transfer } = ingestion;
    const { files, current, uploaded, progress, abort, failed, status } = transfer;

    const onChangeType = useCallback((id: FileId, type: AssetType): void => {
        const changeAssetTypeAction: IngestionDispatchAction = {
            type: TRANSFER_ACTIONS.CHANGE_ASSET_TYPE,
            id,
            assetType: type
        };

        ingestionDispatch(changeAssetTypeAction);
    }, [ingestionDispatch]);

    const onRetry = useCallback((id: FileId): void => {
        if (status !== INGESTION_TRANSFER_STATUS.PROCESSING) {
            const failedUploads = new Map<FileId, IngestionFile>(failed);
            const uploadProgress = new Map<FileId, number>(progress);

            if (failedUploads.has(id)) {
                failedUploads.delete(id);
            }

            if (uploadProgress.has(id)) {
                uploadProgress.delete(id);
            }

            const loadAction: IngestionDispatchAction = {
                type: TRANSFER_ACTIONS.REMOVE_FILE,
                id,
                progress: uploadProgress,
                failed: failedUploads
            };

            ingestionDispatch(loadAction);
        } else {
            if (abort) {
                abort();
            }
        }
    }, [status, failed, abort, progress, ingestionDispatch]);

    const onRemove = useCallback((id: FileId): void => {
        if (status !== INGESTION_TRANSFER_STATUS.PROCESSING) {
            const failedUploads = new Map<FileId, IngestionFile>(failed);
            const uploadProgress = new Map<FileId, number>(progress);

            if (failedUploads.has(id)) {
                failedUploads.delete(id);
            }

            if (uploadProgress.has(id)) {
                uploadProgress.delete(id);
            }

            const loadAction: IngestionDispatchAction = {
                type: TRANSFER_ACTIONS.REMOVE_FILE,
                id,
                progress: uploadProgress,
                failed: failedUploads
            };

            ingestionDispatch(loadAction);
        } else {
            if (abort) {
                abort();
            }
        }
    }, [status, failed, abort, progress, ingestionDispatch]);

    const getFileList = ({ id, file: { name, size }, type }: IngestionFile, index: number) => {
        const uploading = current?.id === id ?? false;
        const complete = uploaded.has(id);
        const hasFailed = failed.has(id);
        const progress = transfer.progress.get(id) || 0;

        return (
            <AnimatePresence key={index}>
                <FileUploadListItem
                    id={id}
                    name={name}
                    size={size}
                    type={type}
                    uploading={uploading}
                    complete={complete}
                    failed={hasFailed}
                    progress={progress}
                    onChangeType={onChangeType}
                    onRetry={onRetry}
                    onRemove={onRemove}
                />
            </AnimatePresence>
        );
    };

    return (
        <Box className={classes.container}>
            <FieldType required>
                <>
                    <Box className={classes.header}>
                        <Box className={classes.fileDetails}>
                            <Typography className={classes.label} variant='body1'>Filename</Typography>
                        </Box>
                        <Box className={classes.size}>
                            <Typography className={classes.label} variant='body1'>Size</Typography>
                        </Box>
                        <Box className={classes.assetType}>
                            <Typography className={classes.label} variant='body1'>Asset Type</Typography>
                        </Box>
                    </Box>
                    <Box className={classes.list}>
                        {!files.length && (
                            <Typography className={classes.emptyListLabel} variant='body1'>No files loaded yet</Typography>
                        )}
                        {files.map(getFileList)}
                    </Box>
                </>
            </FieldType>
        </Box>

    );
}

export default FileUploadList;