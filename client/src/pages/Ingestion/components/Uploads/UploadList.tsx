import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { AnimatePresence } from 'framer-motion';
import React, { useContext } from 'react';
import { FieldType } from '../../../../components';
import { AppContext, AssetType, FileId, IngestionFile, FileUploadStatus, IngestionDispatchAction, UPLOAD_ACTIONS } from '../../../../context';
import useFilesUpload from '../../hooks/useFilesUpload';
import UploadListItem from './UploadListItem';

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
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 80,
        width: '100%',
    },
    listDetail: {
        textAlign: 'center',
        color: palette.grey[500],
        fontStyle: 'italic'
    },
}));

function UploadList(): React.ReactElement {
    const classes = useStyles();
    const { ingestion: { uploads }, ingestionDispatch } = useContext(AppContext);
    const { files, loading } = uploads;

    React.useEffect(() => {
        setTimeout(() => {
            // fetch from server, and process here with FETCH_FAILED
            const fetchSuccessAction: IngestionDispatchAction = {
                type: UPLOAD_ACTIONS.FETCH_COMPLETE,
                files: []
            };

            ingestionDispatch(fetchSuccessAction);
        }, 2000);
    }, [ingestionDispatch]);

    const { changeAssetType, startUpload, retryUpload, cancelUpload, removeUpload } = useFilesUpload();

    const onChangeType = (id: FileId, assetType: AssetType): void => changeAssetType(id, assetType);

    const onUpload = (id: FileId): void => startUpload(id);

    const onRetry = (id: FileId): void => retryUpload(id);

    const onCancel = (id: FileId): void => cancelUpload(id);

    const onRemove = (id: FileId): void => removeUpload(id);

    const onSelect = (id: FileId, selected: boolean): void => {
        const selectAction: IngestionDispatchAction = {
            type: UPLOAD_ACTIONS.SELECT,
            id,
            selected
        };

        ingestionDispatch(selectAction);
    };

    const getFileList = ({ id, name, size, status, selected, progress, type }: IngestionFile, index: number) => {
        const uploading = status === FileUploadStatus.UPLOADING;
        const complete = status === FileUploadStatus.COMPLETE;
        const failed = status === FileUploadStatus.FAILED;
        const cancelled = status === FileUploadStatus.CANCELLED;

        return (
            <AnimatePresence key={index}>
                <UploadListItem
                    id={id}
                    name={name}
                    size={size}
                    type={type}
                    selected={selected}
                    uploading={uploading}
                    complete={complete}
                    failed={failed}
                    cancelled={cancelled}
                    progress={progress}
                    status={status}
                    onChangeType={onChangeType}
                    onSelect={onSelect}
                    onCancel={onCancel}
                    onUpload={onUpload}
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
                        {loading ?
                            <Typography className={classes.listDetail} variant='body1'>Fetching available files...</Typography>
                            :
                            <>
                                {!files.length && <Typography className={classes.listDetail} variant='body1'>No files available</Typography>}
                                {files.map(getFileList)}
                            </>
                        }
                    </Box>
                </>
            </FieldType>
        </Box>

    );
}

export default UploadList;