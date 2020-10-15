/* eslint-disable react-hooks/exhaustive-deps */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import KeepAlive from 'react-activation';
import { useHistory } from 'react-router';
import { toast } from 'react-toastify';
import { Loader, SidebarBottomNavigator } from '../../../../components';
import { HOME_ROUTES, INGESTION_ROUTE, resolveSubRoute } from '../../../../constants';
import { useMetadataStore, useUploadStore, useVocabularyStore } from '../../../../store';
import { Colors } from '../../../../theme';
import UploadCompleteList from './UploadCompleteList';
import UploadFilesPicker from './UploadFilesPicker';
import UploadList from './UploadList';

const useStyles = makeStyles(({ palette, typography, spacing, breakpoints }) => ({
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
        padding: 40,
        paddingBottom: 0,
        [breakpoints.down('lg')]: {
            padding: 20,
            paddingBottom: 0,
        }
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
    },
}));

function Uploads(): React.ReactElement {
    const classes = useStyles();
    const history = useHistory();
    const [loadingVocabulary, setLoadingVocabulary] = useState(true);
    const [gettingAssetDetails, setGettingAssetDetails] = useState(false);
    const [discardingFiles, setDiscardingFiles] = useState(false);
    const { completed, discardFiles } = useUploadStore();
    const { updateMetadataSteps } = useMetadataStore();
    const { updateVocabularyEntries } = useVocabularyStore();

    const fetchVocabularyEntries = async () => {
        setLoadingVocabulary(true);
        await updateVocabularyEntries();
        setLoadingVocabulary(false);
    };

    useEffect(() => {
        fetchVocabularyEntries();
    }, []);

    const onIngest = async () => {
        const nextStep = resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.SUBJECT_ITEM);
        try {
            setGettingAssetDetails(true);
            const { valid, selectedFiles } = await updateMetadataSteps();

            setGettingAssetDetails(false);

            if (!selectedFiles) {
                toast.warn('Please select at least 1 file to ingest');
                return;
            }

            if (!valid) {
                toast.warn('Please select valid combination of files');
                return;
            }

            history.push(nextStep);
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

    let content: React.ReactNode = <Loader maxWidth='55vw' minHeight='60vh' />;

    if (!loadingVocabulary) {
        content = (
            <KeepAlive>
                <React.Fragment>
                    <UploadFilesPicker />
                    <UploadCompleteList />
                    <UploadList />
                </React.Fragment>
            </KeepAlive>
        );
    }

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                {content}
            </Box>
            <SidebarBottomNavigator
                leftLabel='Discard'
                rightLabel='Ingest'
                leftLoading={discardingFiles}
                rightLoading={gettingAssetDetails}
                onClickLeft={onDiscard}
                onClickRight={onIngest}
            />
        </Box>
    );
}

export default Uploads;