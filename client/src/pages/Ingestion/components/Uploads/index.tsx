/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Uploads
 *
 * This component renders the upload specific components for Ingestion UI.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import KeepAlive from 'react-activation';
import { useHistory } from 'react-router';
import { toast } from 'react-toastify';
import { SidebarBottomNavigator } from '../../../../components';
import { HOME_ROUTES, INGESTION_ROUTE, resolveSubRoute } from '../../../../constants';
import { useMetadataStore, useUploadStore, useVocabularyStore } from '../../../../store';
import { Colors } from '../../../../theme';
import { UploadCompleteEvent, UploadEvents, UploadEventType, UploadFailedEvent, UploadProgressEvent, UploadSetCancelEvent } from '../../../../utils/events';
import UploadCompleteList from './UploadCompleteList';
import UploadFilesPicker from './UploadList';
import useIngest from '../../hooks/useIngest';

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto',
        maxHeight: 'calc(100vh - 60px)'
    },
    content: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: 20,
        paddingBottom: 0
    },
    fileDrop: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '30vh',
        width: '40vw',
        border: `1px dashed ${palette.primary.main}`,
        borderRadius: 10,
        backgroundColor: palette.primary.light
    },
    uploadIcon: {
        color: palette.primary.main
    },
    uploadTitle: {
        margin: '2% 0px',
        fontSize: '1.2em',
        fontWeight: typography.fontWeightMedium
    },
    uploadButton: {
        width: 120,
        fontSize: typography.caption.fontSize,
        marginTop: spacing(1),
        color: Colors.defaults.white
    }
}));

function Uploads(): React.ReactElement {
    const classes = useStyles();
    const history = useHistory();
    const [gettingAssetDetails, setGettingAssetDetails] = useState(false);
    const [discardingFiles, setDiscardingFiles] = useState(false);

    const updateVocabularyEntries = useVocabularyStore(state => state.updateVocabularyEntries);
    const [completed, discardFiles, setUpdateMode, setUpdateWorkflowFileType, updateMode, getSelectedFiles] = useUploadStore(state => [
        state.completed,
        state.discardFiles,
        state.setUpdateMode,
        state.setUpdateWorkflowFileType,
        state.updateMode,
        state.getSelectedFiles
    ]);
    const [updateMetadataSteps, updateMetadataFolders, getMetadataInfo, getMetadatas] = useMetadataStore(state => [
        state.updateMetadataSteps,
        state.updateMetadataFolders,
        state.getMetadataInfo,
        state.getMetadatas
    ]);
    const { ingestionStart, ingestionComplete } = useIngest();

    const urlParams = new URLSearchParams(window.location.search);
    useEffect(() => {
        setUpdateMode(urlParams.has('mode'));
        if (urlParams.has('fileType')) setUpdateWorkflowFileType(Number(urlParams.get('fileType')));
    }, [setUpdateMode, window.location.search]);

    const onNext = async (): Promise<void> => {
        try {
            await updateVocabularyEntries();
            await updateMetadataFolders();

            const queuedUploadedFiles = getSelectedFiles(completed, true);
            console.log('queueduploadfiles', queuedUploadedFiles);

            // This is where the logic for short circuiting the item/subject and metadata steps occur
            // Make an array of all the queuedUploadedFiles that are of type photo, model, and scene
            // if that array has length 0
            // then proceed with the short circuiting
            // otherwise manipulate the metadatas so that the first few are considered updated and only apply metadata steps for the ones in the back
            // continue with the process until the finish is clicked
            if (updateMode && queuedUploadedFiles.every(file => file.type !== 86 && file.type !== 94 && file.type !== 97)) {
                const { success, message } = await ingestionStart();
                if (success) {
                    toast.success('Ingestion complete');
                    ingestionComplete();
                    setUpdateMode(false);
                } else {
                    toast.error(`Ingestion failed, please try again later. Error: ${message}`);
                }
                return;
            } else {
                const metadatas = getMetadatas();
                const {
                    file: { id, type }
                } = metadatas[0];
                const { isLast } = getMetadataInfo(id);
                const nextRoute = resolveSubRoute(HOME_ROUTES.INGESTION, `${INGESTION_ROUTE.ROUTES.METADATA}?fileId=${id}&type=${type}&last=${isLast}`);
                toast.dismiss();
                await history.push(nextRoute);
            }
        } catch (error) {
            toast.error(error);
            return;
        }
    };

    const onIngest = async (): Promise<void> => {
        const nextStep = resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.SUBJECT_ITEM);
        try {
            setGettingAssetDetails(true);
            const data = await updateMetadataSteps();
            const { valid, selectedFiles, error } = data;
            setGettingAssetDetails(false);

            if (error) return;

            if (!selectedFiles) {
                toast.warn('Please select at least 1 file to ingest');
                return;
            }

            if (!valid) {
                toast.warn('Please select valid combination of files');
                return;
            }
            toast.dismiss();

            updateMode ? onNext() : await history.push(nextStep);
        } catch {
            setGettingAssetDetails(false);
        }
    };

    const onDiscard = async () => {
        if (completed.length) {
            try {
                setDiscardingFiles(true);
                await discardFiles();
                setDiscardingFiles(false);
            } catch {
                setDiscardingFiles(false);
            }
        }
    };

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                <KeepAlive>
                    <AliveUploadComponents onDiscard={onDiscard} onIngest={onIngest} discardingFiles={discardingFiles} gettingAssetDetails={gettingAssetDetails} />
                </KeepAlive>
            </Box>
        </Box>
    );
}

type AliveUploadComponentsProps = {
    discardingFiles: boolean;
    gettingAssetDetails: boolean;
    onDiscard: () => Promise<void>;
    onIngest: () => Promise<void>;
};

function AliveUploadComponents(props: AliveUploadComponentsProps): React.ReactElement {
    const { discardingFiles, gettingAssetDetails, onDiscard, onIngest } = props;
    const [onProgressEvent, onSetCancelledEvent, onFailedEvent, onCompleteEvent] = useUploadStore(state => [
        state.onProgressEvent,
        state.onSetCancelledEvent,
        state.onFailedEvent,
        state.onCompleteEvent
    ]);

    useEffect(() => {
        const onProgress = data => {
            const eventData: UploadProgressEvent = data.detail;
            onProgressEvent(eventData);
        };

        UploadEvents.subscribe(UploadEventType.PROGRESS, onProgress);

        const onSetCancelled = data => {
            const eventData: UploadSetCancelEvent = data.detail;
            onSetCancelledEvent(eventData);
        };

        UploadEvents.subscribe(UploadEventType.SET_CANCELLED, onSetCancelled);

        const onFailed = data => {
            const eventData: UploadFailedEvent = data.detail;
            onFailedEvent(eventData);
        };

        UploadEvents.subscribe(UploadEventType.FAILED, onFailed);

        const onComplete = data => {
            const eventData: UploadCompleteEvent = data.detail;
            onCompleteEvent(eventData);
        };

        UploadEvents.subscribe(UploadEventType.COMPLETE, onComplete);

        return () => {
            console.log('Thread closed');
        };
    }, []);

    return (
        <React.Fragment>
            <UploadFilesPicker />
            <SidebarBottomNavigator
                leftLabel='Discard'
                rightLabel='Ingest'
                leftLoading={discardingFiles}
                rightLoading={gettingAssetDetails}
                onClickLeft={onDiscard}
                onClickRight={onIngest}
                uploadVersion
            />
            <UploadCompleteList />
        </React.Fragment>
    );
}

export default Uploads;
