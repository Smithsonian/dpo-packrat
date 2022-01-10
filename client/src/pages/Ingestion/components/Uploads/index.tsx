/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { HOME_ROUTES, INGESTION_ROUTE, resolveSubRoute, eIngestionMode } from '../../../../constants';
import { useMetadataStore, useUploadStore, useVocabularyStore } from '../../../../store';
import { Colors } from '../../../../theme';
import { UploadCompleteEvent, UploadEvents, UploadEventType, UploadFailedEvent, UploadProgressEvent, UploadSetCancelEvent } from '../../../../utils/events';
import UploadCompleteList from './UploadCompleteList';
import UploadFilesPicker from './UploadList';
import useIngest from '../../hooks/useIngest';
import { eVocabularySetID } from '../../../../types/server';
import { Helmet } from 'react-helmet';

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
    // this state will be responsible for feeding metadata the info it needs for update
    const [updatedAssetVersionMetadata, setUpdatedAssetVersionMetadata] = useState();

    const [updateVocabularyEntries, getEntries] = useVocabularyStore(state => [state.updateVocabularyEntries, state.getEntries]);
    const [completed, discardFiles, setUpdateMode, setUpdateWorkflowFileType, getSelectedFiles, selectFile] = useUploadStore(state => [
        state.completed,
        state.discardFiles,
        state.setUpdateMode,
        state.setUpdateWorkflowFileType,
        state.getSelectedFiles,
        state.selectFile
    ]);
    const [updateMetadataSteps, updateMetadataFolders, getMetadataInfo, getMetadatas] = useMetadataStore(state => [
        state.updateMetadataSteps,
        state.updateMetadataFolders,
        state.getMetadataInfo,
        state.getMetadatas
    ]);
    const { ingestionStart, ingestionComplete } = useIngest();
    const assetTypes = getEntries(eVocabularySetID.eAssetAssetType);
    let idVAssetType: number;
    const urlParams = new URLSearchParams(window.location.search);

    // Responsible for setting UpdateMode state and file type so that it files to be updated will have the appropriate file type
    useEffect(() => {
        setUpdateMode(Number(urlParams.get('mode')) === eIngestionMode.eIngest);
        const fileType = urlParams.get('fileType');
        if (fileType && typeof fileType === 'string') {
            for (let i = 0; i < assetTypes.length; i++) {
                if (assetTypes[i].Term === fileType) {
                    idVAssetType = assetTypes[i].idVocabulary;
                    break;
                }
            }
            // setting update workflow file type here allows the FileListItem to automatically select the correct asset type
            setUpdateWorkflowFileType(idVAssetType);
        }
    }, [setUpdateMode, window.location.search]);

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
                // console.log(`Uploads onNext() nextRoute=${nextRoute}, metadatas=${JSON.stringify(metadatas)}`);
                toast.dismiss();
                await history.push(nextRoute);
            }
        } catch (error) {
            const message: string = (error instanceof Error) ? `: ${error.message}` : '';
            toast.error(`Ingestion failed${message}`);
            return;
        }
    };

    const onIngest = async (): Promise<void> => {
        const nextStep = resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.SUBJECT_ITEM);
        try {
            setGettingAssetDetails(true);
            const data = await updateMetadataSteps(updatedAssetVersionMetadata);
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
            const toBeIngested = getSelectedFiles(completed, true);

            // if every selected file is for update OR attach, skip the subject/items step
            if (toBeIngested.every(file => file.idAsset ||  file.idSOAttachment)) {
                onNext();
            } else {
                await history.push(nextStep);
            }
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
            <UploadCompleteList setUpdatedAssetVersionMetadata={setUpdatedAssetVersionMetadata} />
        </React.Fragment>
    );
}

export default Uploads;
