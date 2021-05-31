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
import { eVocabularySetID } from '../../../../types/server';

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

    const [updateVocabularyEntries, getEntries] = useVocabularyStore(state => [state.updateVocabularyEntries, state.getEntries]);
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

    // we need a separate useEffect here
    // if mode is indicates that we're ingesting something from Scene Ingestion
    // we will take a look at the uploaded files and use something like Model.fetchByFileNameSizeAndAssetType
    // if we can find it, immediately select that as the file
    // go through the ingestion process

    const onNext = async (): Promise<void> => {
        try {
            await updateVocabularyEntries();
            await updateMetadataFolders();

            const queuedUploadedFiles = getSelectedFiles(completed, true);
            const assetTypes = getEntries(eVocabularySetID.eAssetAssetType);
            const metadataStepRequiredAssetTypesSet = new Set();
            assetTypes.forEach(assetType => {
                if (assetType.Term === 'Capture Data Set: Photogrammetry' || assetType.Term === 'Model' || assetType.Term === 'Scene')
                    metadataStepRequiredAssetTypesSet.add(assetType.idVocabulary);
            });

            if (updateMode && queuedUploadedFiles.every(file => !metadataStepRequiredAssetTypesSet.has(file.type))) {
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

            // this should be reading the ready files, not the updateMode state
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
