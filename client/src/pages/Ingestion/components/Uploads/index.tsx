/* eslint-disable react-hooks/exhaustive-deps */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useContext, useState, useEffect } from 'react';
import KeepAlive from 'react-activation';
import { SidebarBottomNavigator, Loader } from '../../../../components';
import { HOME_ROUTES, INGESTION_ROUTE, resolveSubRoute } from '../../../../constants';
import { Colors } from '../../../../theme';
import UploadFilesPicker from './UploadFilesPicker';
import UploadList from './UploadList';
import UploadCompleteList from './UploadCompleteList';
import { useHistory } from 'react-router';
import useFilesUpload from '../../hooks/useFilesUpload';
import { toast } from 'react-toastify';
import { AppContext } from '../../../../context';
import useVocabularyEntries from '../../hooks/useVocabularyEntries';

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
    container: {
        display: 'flex',
        flexDirection: 'column'
    },
    content: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: '40px 0px 0px 40px'
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
    const { ingestion: { uploads } } = useContext(AppContext);
    const { updateMetadataSteps, discardFiles } = useFilesUpload();
    const { updateVocabularyEntries } = useVocabularyEntries();

    const fetchVocabularyEntries = async () => {
        setLoadingVocabulary(true);
        await updateVocabularyEntries();
        setLoadingVocabulary(false);
    };

    useEffect(() => {
        fetchVocabularyEntries();
    }, []);

    const onIngest = () => {
        const nextStep = resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.SUBJECT_ITEM);
        const success = updateMetadataSteps();

        if (success) {
            history.push(nextStep);
        } else {
            toast.warn('Please select at least 1 file to ingest');
        }
    };

    const onDiscard = () => {
        if (uploads.files.length) {
            const isConfirmed = global.confirm('Do you want to discard current items?');
            if (isConfirmed) {
                discardFiles();
            }
        }
    };

    return (
        <KeepAlive>
            <Box className={classes.container}>
                <Box className={classes.content}>
                    {
                        loadingVocabulary ?
                            <Loader minHeight='60vh' />
                            : (
                                <>
                                    <UploadFilesPicker />
                                    <UploadCompleteList />
                                    <UploadList />
                                </>
                            )
                    }

                </Box>
                <SidebarBottomNavigator
                    leftLabel='Discard'
                    rightLabel='Ingest'
                    onClickLeft={onDiscard}
                    onClickRight={onIngest}
                />
            </Box>
        </KeepAlive >
    );
}

export default Uploads;