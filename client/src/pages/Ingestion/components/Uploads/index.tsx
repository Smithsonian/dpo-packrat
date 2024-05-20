/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Uploads
 *
 * This component renders the upload specific components for Ingestion UI.
 */
import { Box } from '@material-ui/core';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import KeepAlive from 'react-activation';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { SidebarBottomNavigator } from '../../../../components';
import { HOME_ROUTES, INGESTION_ROUTE, resolveSubRoute } from '../../../../constants';
import { useMetadataStore, useUploadStore, useVocabularyStore } from '../../../../store';
import { Colors } from '../../../../theme';
import { UploadCompleteEvent, UploadEvents, UploadEventType, UploadFailedEvent, UploadProgressEvent, UploadSetCancelEvent } from '../../../../utils/events';
import UploadCompleteList from './UploadCompleteList';
import UploadFilesPicker from './UploadList';
import useIngest from '../../hooks/useIngest';
import { eVocabularySetID } from '@dpo-packrat/common';
import { Helmet } from 'react-helmet';

const useStyles = makeStyles(({ palette, typography, spacing }) => createStyles({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        // overflow: 'auto',
        maxHeight: 'calc(100vh - 60px)',
        overflow: 'hidden'
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
    },
    uploadIcon: {
        color: palette.primary.main
    },
    uploadTitle: {
        margin: '2% 0px',
        fontSize: '1.2em',
        fontWeight: 500
    },
    uploadButton: {
        width: 120,
        fontSize: typography.caption.fontSize,
        marginTop: spacing(1),
        color: Colors.defaults.white
    },
    ingestContainer: {
        borderRadius: '0.5rem',
        border: `1px dashed ${palette.primary.main}`,
        overflow: 'hidden',
        backgroundColor: palette.primary.light,
        padding: '0px 10px',
        marginBottom: '2rem',
    },
}));

function Uploads(): React.ReactElement {
    const classes = useStyles();
    const navigate = useNavigate();
    const [gettingAssetDetails, setGettingAssetDetails] = useState(false);
    const [discardingFiles, setDiscardingFiles] = useState(false);
    // this state will be responsible for feeding metadata the info it needs for update
    const [updatedAssetVersionMetadata, setUpdatedAssetVersionMetadata] = useState();

    const [updateVocabularyEntries, getEntries] = useVocabularyStore(state => [state.updateVocabularyEntries, state.getEntries]);
    const [completed, discardFiles, getSelectedFiles, selectFile] = useUploadStore(state => [
        state.completed,
        state.discardFiles,
        state.getSelectedFiles,
        state.selectFile
    ]);
    const [updateMetadataSteps, updateMetadataFolders, getMetadataInfo, getMetadatas] = useMetadataStore(state => [
        state.updateMetadataSteps,
        state.updateMetadataFolders,
        state.getMetadataInfo,
        state.getMetadatas
    ]);
    const { ingestionStart, ingestionComplete, ingestionReset } = useIngest();
    const assetTypes = getEntries(eVocabularySetID.eAssetAssetType);
    const urlParams = new URLSearchParams(window.location.search);

    // Responsible for checking if there's an uploaded model with the same name as the one intended to be ingested. If there is, automatically select it and start the ingestion workflow
    useEffect(() => {
        automatedIngestionProcess();
    }, [completed]);

    const automatedIngestionProcess = async () => {
        if (urlParams.has('name')) {
            let matchingUploadedFileId = -1;
            if (completed.length > 0) {
                const matchingUploadedFileIndex = completed.findIndex(uploadedFile => uploadedFile.name === urlParams.get('name'));
                if (matchingUploadedFileIndex > -1) {
                    matchingUploadedFileId = +completed[matchingUploadedFileIndex].id;
                    await selectFile(matchingUploadedFileId.toString(), true);
                    await onIngest();
                }
            }
        }
    };

    const onNext = async (): Promise<void> => {
        try {
            await updateVocabularyEntries();
            await updateMetadataFolders();

            const queuedUploadedFiles = getSelectedFiles(completed, true);
            const metadataStepRequiredAssetTypesSet = new Set();
            assetTypes.forEach(assetType => {
                switch (assetType.Term) {
                    case 'Capture Data Set: Photogrammetry':
                    case 'Capture Data File':
                    case 'Model':
                    case 'Scene':
                    case 'Attachment':
                        metadataStepRequiredAssetTypesSet.add(assetType.idVocabulary);
                        break;
                }
            });

            // Start ingestion if every file is not an update and does not require metadata
            if (queuedUploadedFiles.every(file => !file.idAsset && !metadataStepRequiredAssetTypesSet.has(file.type))) {
                const { success, message } = await ingestionStart();
                if (success) {
                    toast.success('Ingestion complete');
                    ingestionComplete();
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
                // console.log(`Uploads onNext() nextRoute=${nextRoute}, metadatas=${JSON.stringify(metadatas)}`);
                toast.dismiss();
                await navigate(nextRoute);
            }
        } catch (error) {
            const message: string = (error instanceof Error) ? `: ${error.message}` : '';
            toast.error(`Ingestion failed${message}`);
            return;
        }
    };

    const onIngest = async (): Promise<void> => {
        const nextStep = resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.SUBJECT_MEDIA_GROUP);
        try {
            ingestionReset();
            setGettingAssetDetails(true);
            // console.log(`Uploads.onIngest updatedAssetVersionMetadata=${JSON.stringify(updatedAssetVersionMetadata)}`);
            const data = await updateMetadataSteps(updatedAssetVersionMetadata);
            const { valid, selectedFiles, error } = data;
            // console.log(`Uploads.onIngest ${JSON.stringify(data)}`);
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
            const toBeIngested = getSelectedFiles(completed, true);

            // if every selected file is for update OR attach, skip the subject/items step
            if (toBeIngested.every(file => file.idAsset ||  file.idSOAttachment)) {
                // console.log('Uploads.onIngest onNext');
                onNext();
            } else {
                // console.log(`Uploads.onIngest navigate.push(${nextStep})`);
                await navigate(nextStep);
            }
        } catch (error) {
            // console.log(`Uploads.onIngest Exception: ${JSON.stringify(error)}`);
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
            <Helmet>
                <title>Uploads Ingestion</title>
            </Helmet>
            <Box className={classes.content}>
                <KeepAlive>
                    <AliveUploadComponents
                        onDiscard={onDiscard}
                        onIngest={onIngest}
                        discardingFiles={discardingFiles}
                        gettingAssetDetails={gettingAssetDetails}
                        setUpdatedAssetVersionMetadata={setUpdatedAssetVersionMetadata}
                    />
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
    setUpdatedAssetVersionMetadata: (metadata: any) => void;
};

function AliveUploadComponents(props: AliveUploadComponentsProps): React.ReactElement {
    const classes = useStyles();
    // console.log(`AliveUploadComponents ${JSON.stringify(props)}`);
    const { discardingFiles, gettingAssetDetails, onDiscard, onIngest, setUpdatedAssetVersionMetadata } = props;
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
            UploadEvents.unsubscribe(UploadEventType.PROGRESS, onProgress);
            UploadEvents.unsubscribe(UploadEventType.SET_CANCELLED, onSetCancelled);
            UploadEvents.unsubscribe(UploadEventType.FAILED, onFailed);
            UploadEvents.unsubscribe(UploadEventType.COMPLETE, onComplete);
            console.log('Thread closed');
        };
    }, []);

    return (
        <React.Fragment>
            <Box className={classes.ingestContainer}>
                <UploadFilesPicker />
            </Box>
            <Box className={classes.ingestContainer}>
                <UploadCompleteList setUpdatedAssetVersionMetadata={setUpdatedAssetVersionMetadata} />
                <SidebarBottomNavigator
                    leftLabel='Discard'
                    rightLabel='Ingest'
                    leftLoading={discardingFiles}
                    rightLoading={gettingAssetDetails}
                    onClickLeft={onDiscard}
                    onClickRight={onIngest}
                    uploadVersion
                />
            </Box>
        </React.Fragment>
    );
}

export default Uploads;