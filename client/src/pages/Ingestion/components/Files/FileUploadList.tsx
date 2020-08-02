import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { AnimatePresence } from 'framer-motion';
import React, { useContext } from 'react';
import { FieldType } from '../../../../components';
import { AppContext, AssetType, FileId, IngestionFile } from '../../../../context';
import useFilesUpload from '../../hooks/useFilesUpload';
import FileUploadListItem from './FileUploadListItem';

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
        minHeight: 80,
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
    const { ingestion: { uploads } } = useContext(AppContext);
    const { files } = uploads;

    const { changeAssetType, startUpload, retryUpload, cancelUpload, removeUpload } = useFilesUpload();

    const onChangeType = (id: FileId, assetType: AssetType): void => changeAssetType(id, assetType);

    const onUpload = (id: FileId): void => startUpload(id);

    const onRetry = (id: FileId): void => retryUpload(id);

    const onCancel = (id: FileId): void => cancelUpload(id);

    const onRemove = (id: FileId): void => removeUpload(id);

    const getFileList = ({ id, file, status, progress, type }: IngestionFile, index: number) => {
        const uploading = status === 'UPLOADING';
        const complete = status === 'SUCCESS';
        const failed = status === 'FAILED';
        const cancelled = status === 'CANCELLED';

        return (
            <AnimatePresence key={index}>
                <FileUploadListItem
                    id={id}
                    file={file}
                    type={type}
                    uploading={uploading}
                    complete={complete}
                    failed={failed}
                    cancelled={cancelled}
                    progress={progress}
                    status={status}
                    onChangeType={onChangeType}
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
                        {!files.length && <Typography className={classes.emptyListLabel} variant='body1'>No files loaded yet</Typography>}
                        {files.map(getFileList)}
                    </Box>
                </>
            </FieldType>
        </Box>

    );
}

export default FileUploadList;