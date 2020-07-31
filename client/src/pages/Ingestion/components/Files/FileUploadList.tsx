import React, { useContext, useCallback } from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { colorWithOpacity } from '../../../../theme/colors';
import { AppContext, TRANSFER_ACTIONS, INGESTION_TRANSFER_STATUS, FileId, IngestionFile, IngestionDispatchAction } from '../../../../context';
import FileUploadListItem from './FileUploadListItem';
import { toast } from 'react-toastify';
import { AnimatePresence } from 'framer-motion';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        marginTop: 20,
        maxHeight: '40vh',
        width: '40vw',
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
    item: {
        display: 'flex',
        padding: '0px 20px',
        minHeight: 50,
        alignItems: 'center',
        backgroundColor: colorWithOpacity(palette.primary.light, 66),
        marginBottom: 10,
        borderRadius: 5,
    },
    itemName: {
        display: 'flex',
        flex: 2,
    },
    itemSize: {
        display: 'flex',
        flex: 1,
        color: palette.grey[600]
    },
    itemOptions: {
        display: 'flex',
        flex: 1,
        justifyContent: 'flex-end',
        color: palette.error.main
    },
}));

function FileUploadList(): React.ReactElement {
    const classes = useStyles();
    const { ingestion, ingestionDispatch } = useContext(AppContext);
    const { transfer } = ingestion;
    const { files, current, uploaded, failed, status } = transfer;

    const onRemove = useCallback((id: FileId): void => {
        if (status !== INGESTION_TRANSFER_STATUS.PROCESSING) {
            const failedUploads = new Map<FileId, IngestionFile>(failed);
            if (failedUploads.has(id)) {
                failedUploads.delete(id);
            }

            const loadAction: IngestionDispatchAction = {
                type: TRANSFER_ACTIONS.REMOVE_FILE,
                id,
                failed: failedUploads
            };

            ingestionDispatch(loadAction);
        } else {
            toast.info('Please wait for current uploads to be finished');
        }
    }, [status, failed, ingestionDispatch]);

    const getFileList = ({ id, file: { name, size } }: IngestionFile, index: number) => {
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
                    uploading={uploading}
                    complete={complete}
                    failed={hasFailed}
                    progress={progress}
                    onRemove={onRemove}
                />
            </AnimatePresence>
        );
    };

    return (
        <Box className={classes.container}>
            {files.map(getFileList)}
        </Box>
    );
}

export default FileUploadList;