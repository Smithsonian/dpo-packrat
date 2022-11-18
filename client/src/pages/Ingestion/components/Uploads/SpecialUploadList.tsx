/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react-hooks/exhaustive-deps */

/**
 * SpecialUploadList
 *
 * This component renders pending files for special types of ingestion, such as attachment and update.
 */
import { Box, Typography, Button, IconButton } from '@material-ui/core';
import React, { useEffect } from 'react';
import Dropzone from 'react-dropzone';
import { BsCloudUpload } from 'react-icons/bs';
import { Colors } from '../../../../theme';
import { FieldType } from '../../../../components';
import FileList from './FileList';
import UploadListHeader from './UploadListHeader';
import { eIngestionMode, HOME_ROUTES, resolveSubRoute, INGESTION_ROUTE } from '../../../../constants';
import { UploadReferences, IngestionFile, useUploadStore } from '../../../../store';
import CloseIcon from '@material-ui/icons/Close';
import KeepAlive from 'react-activation';
import { UploadCompleteEvent, UploadEvents, UploadEventType, UploadFailedEvent, UploadProgressEvent, UploadSetCancelEvent } from '../../../../utils/events';
import { useNavigate } from 'react-router';
import { useUploadListStyles } from './UploadList';

type UploadListProps = {
    open: () => void;
    uploadType: eIngestionMode;
    references?: UploadReferences;
    onUploaderClose: () => void;
    idSO: number;
};

type SpecialUploadListProps = {
    uploadType: eIngestionMode;
    idAsset?: number;
    idSOAttachment?: number;
    idSO: number;
    onUploaderClose: () => void;
};

function UploadList(props: UploadListProps): React.ReactElement {
    const classes = useUploadListStyles();
    const { pendingUpdates, pendingAttachments } = useUploadStore();
    const { open, uploadType, references, onUploaderClose, idSO } = props;

    const file: IngestionFile | undefined = uploadType === eIngestionMode.eUpdate ? pendingUpdates.get(idSO) : pendingAttachments.get(idSO);
    const files: IngestionFile[] = file ? [file] : [];

    return (
        <Box className={classes.container} id='special-uploader'>
            <IconButton color='inherit' onClick={onUploaderClose} style={{ alignSelf: 'end' }}>
                <CloseIcon />
            </IconButton>
            <FieldType
                required
                align='center'
                label={`Upload A New ${uploadType === eIngestionMode.eAttach ? 'Attachment' : 'Version'}`}
                labelProps={{ style: { fontSize: '1em', fontWeight: 500, margin: '1% 0px', color: Colors.defaults.dark, backgroundColor: 'rgb(236, 245, 253)' } }}
                width={'calc(100% - 20px)'}
                padding='10px'
            >
                <UploadListHeader />
                <Box className={classes.list}>
                    <FileList files={files} uploadPendingList references={references} uploadType={uploadType} idSystemObject={idSO} />
                    <Typography className={classes.title}>Drag and drop file here or click the button</Typography>
                    <BsCloudUpload className={classes.icon} size='50px' />
                    <Button className={classes.button} color='primary' variant='contained' onClick={open} disabled={!!file} disableElevation>
                        Browse files
                    </Button>
                </Box>
            </FieldType>
        </Box>
    );
}

function SpecialUploadList(props: SpecialUploadListProps): React.ReactElement {
    const { uploadType, idAsset, idSOAttachment, onUploaderClose, idSO } = props;
    const [onProgressEvent, onSetCancelledEvent, onFailedEvent, onCompleteEvent, loadSpecialPending] = useUploadStore(state => [
        state.onProgressEvent,
        state.onSetCancelledEvent,
        state.onFailedEvent,
        state.onCompleteEvent,
        state.loadSpecialPending
    ]);
    const navigate = useNavigate();
    const uploadReferences = { idAsset, idSOAttachment };
    const options = { idSystemObject: idSO, references: uploadReferences };

    useEffect(() => {
        const onProgress = data => {
            const eventData: UploadProgressEvent = data.detail;
            onProgressEvent(eventData, options);
        };

        UploadEvents.subscribe(UploadEventType.PROGRESS, onProgress);

        const onSetCancelled = data => {
            const eventData: UploadSetCancelEvent = data.detail;
            onSetCancelledEvent(eventData, options);
        };

        UploadEvents.subscribe(UploadEventType.SET_CANCELLED, onSetCancelled);

        const onFailed = data => {
            const eventData: UploadFailedEvent = data.detail;
            onFailedEvent(eventData, options);
        };

        UploadEvents.subscribe(UploadEventType.FAILED, onFailed);

        const onComplete = data => {
            const eventData: UploadCompleteEvent = data.detail;
            onCompleteEvent(eventData, options);
            // when an upload finishes, we want to redirect user to uploads
            navigate(resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.UPLOADS));
        };

        UploadEvents.subscribe(UploadEventType.COMPLETE, onComplete);

        return () => {
            UploadEvents.unsubscribe(UploadEventType.PROGRESS, onProgress);
            UploadEvents.unsubscribe(UploadEventType.SET_CANCELLED, onSetCancelled);
            UploadEvents.unsubscribe(UploadEventType.FAILED, onFailed);
            UploadEvents.unsubscribe(UploadEventType.COMPLETE, onComplete);

            console.log('Thread closed');
        };
    }, []);

    const onDrop = (acceptedFiles: File[]) => {
        loadSpecialPending(acceptedFiles, uploadReferences, idSO);
    };

    return (
        <KeepAlive>
            <Dropzone noClick onDrop={onDrop} multiple={false}>
                {({ getRootProps, getInputProps, open }) => (
                    <div {...getRootProps()}>
                        <UploadList open={open} uploadType={uploadType} references={uploadReferences} onUploaderClose={onUploaderClose} idSO={idSO} />
                        <input title='File Uploader' {...getInputProps()} />
                    </div>
                )}
            </Dropzone>
        </KeepAlive>
    );
}

export default SpecialUploadList;
