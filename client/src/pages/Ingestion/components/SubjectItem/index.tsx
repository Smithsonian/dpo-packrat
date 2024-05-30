/**
 * SubjectItem
 *
 * This component renders the subject and item specific components for Ingestion UI.
 */
import { Box, Chip, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { FieldType, SidebarBottomNavigator } from '../../../../components';
import { HOME_ROUTES, INGESTION_ROUTE, resolveSubRoute } from '../../../../constants';
import { useItemStore, useMetadataStore, useSubjectStore, useVocabularyStore } from '../../../../store';
import ItemList from './ItemList';
import SearchList from './SearchList';
import SubjectList from './SubjectList';
import { Helmet } from 'react-helmet';
import useIngest from '../../hooks/useIngest';
import { confirmLeaveIngestion } from '../..';
//import { HelpOutline } from '@material-ui/icons';
//import { Tooltip } from 'client/src/components/controls/ToolTip';

const useStyles = makeStyles(({ palette }) => ({
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
        // width: '52vw',
        flexDirection: 'column',
        padding: 20,
        paddingBottom: 0
    },
    filesLabel: {
        color: palette.primary.dark,
        marginRight: 20,
        fontWeight: 'bold',
        fontSize: '1em',
    },
    fieldContainer: {
        borderRadius: '0.5rem',
        border: `1px dashed ${palette.primary.main}`,
        overflow: 'hidden',
        margin: '0.5rem',
        padding: 0
    },
    fileChip: {
        marginRight: 10
    },
    ingestContainer: {
        borderRadius: '0.5rem',
        border: `1px dashed ${palette.primary.main}`,
        overflow: 'hidden',
        backgroundColor: palette.primary.light,
        padding: 0,
        marginBottom: '1rem',
    },
}));

function SubjectItem(): React.ReactElement {
    const classes = useStyles();
    const navigate = useNavigate();

    const [subjectError, setSubjectError] = useState(false);
    const [itemError, setItemError] = useState(false);
    const [metadataStepLoading, setMetadataStepLoading] = useState(false);

    const updateVocabularyEntries = useVocabularyStore(state => state.updateVocabularyEntries);
    const subjects = useSubjectStore(state => state.subjects);
    const [itemsLoading, getSelectedItem] = useItemStore(state => [state.loading, state.getSelectedItem]);
    const [metadatas, updateMetadataFolders, getMetadataInfo, initializeSubtitlesForModels] = useMetadataStore(state => [state.metadatas, state.updateMetadataFolders, state.getMetadataInfo, state.initializeSubtitlesForModels]);
    const { ingestionReset } = useIngest();
    const selectedItem = getSelectedItem();

    useEffect(() => {
        if (subjects.length > 0) {
            setSubjectError(false);
        }
    }, [subjects]);

    useEffect(() => {
        if (selectedItem) {
            if (selectedItem.subtitle.length) {
                setItemError(false);
            }
        }
    }, [selectedItem]);

    const onNext = async (): Promise<void> => {
        toast.dismiss();
        let error: boolean = false;
        // Note: we only want certain warnings to flag if we have missing fields after selecting an new item
        const isItemSelected = !!selectedItem;

        if (!subjects.length) {
            error = true;
            setSubjectError(true);
            toast.warn('Please provide at least one subject', { autoClose: false });
        }

        if (!selectedItem) {
            error = true;
            setItemError(true);
            toast.warn('Please select or provide a media group', { autoClose: false });
        }

        if (isItemSelected && selectedItem?.idProject === -1) {
            error = true;
            setItemError(true);
            toast.warn('Please select a project for media group', { autoClose: false });
        }

        if (isItemSelected && selectedItem?.entireSubject === null) {
            error = true;
            setItemError(true);
            toast.warn('Please indicate whether media group is entire subject', { autoClose: false });
        }

        if (isItemSelected && (subjects.length > 1 || !selectedItem?.entireSubject) && selectedItem?.subtitle.trim() === '' && selectedItem.id === 'default') {
            error = true;
            setItemError(true);
            toast.warn('Please provide a valid subtitle for media group', { autoClose: false });
        }

        if (error) return;

        await initializeSubtitlesForModels();
        try {
            setMetadataStepLoading(true);
            await updateVocabularyEntries();
            await updateMetadataFolders();
            setMetadataStepLoading(false);
        } catch (error) {
            const message: string = (error instanceof Error) ? `: ${error.message}` : '';
            toast.error(`Failure handling input${message}`);
            setMetadataStepLoading(false);
            return;
        }

        const { file: { id, type } } = metadatas[0];
        const { isLast } = getMetadataInfo(id);
        const nextRoute = resolveSubRoute(HOME_ROUTES.INGESTION, `${INGESTION_ROUTE.ROUTES.METADATA}?fileId=${id}&type=${type}&last=${isLast}`);
        toast.dismiss();
        navigate(nextRoute);
    };

    const metadataLength = metadatas.length;

    if (!metadataLength) {
        return <Navigate to={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.UPLOADS)} />;
    }

    return (
        <Box className={classes.container}>
            <Helmet>
                <title>Subject Ingestion</title>
            </Helmet>
            <Box className={classes.content}>
                <Box display='flex' flexDirection='row' alignItems='center' flexWrap='wrap'>
                    <Typography className={classes.filesLabel}>Select Subject and Media Group for:</Typography>
                    {metadatas.map(({ file }, index) => <Chip key={index} className={classes.fileChip} label={file.name} variant='outlined' />)}
                </Box>
                <Box className={classes.ingestContainer} style={{ marginTop: '2rem' }}>
                    <SearchList />
                </Box>

                <Box className={classes.ingestContainer}>
                    <FieldType
                        error={subjectError}
                        required
                        label='Subject(s) Selected'
                        align='center'
                        labelProps={{ style: { fontSize: '1em', fontWeight: 500, margin: '1% 0px', padding: 0 } }}
                        labelTooltip='This shows the subject currently selected.'
                    >
                        <SubjectList subjects={subjects} selected emptyLabel='Search and select subject from above' />
                    </FieldType>
                </Box>

                <Box className={classes.ingestContainer}>
                    <FieldType
                        loading={itemsLoading}
                        error={itemError}
                        required
                        label='Media Group'
                        padding='10px'
                        align='center'
                        labelProps={{ style: { fontSize: '1em', fontWeight: 500, margin: '1% 0px' } }}
                        labelTooltip='Media groups are basically a group of digital assets that when grouped together can be used to make up a single subject or portion of a subject.  Each subject can have more than one media group'
                    >
                        <ItemList />
                    </FieldType>
                </Box>

            </Box>
            <SidebarBottomNavigator
                rightLoading={metadataStepLoading}
                leftLabel='Previous'
                rightLabel='Next'
                onClickRight={onNext}
                onClickLeft={(e) => {
                    const leaveIngestion = confirmLeaveIngestion();
                    if (!leaveIngestion) {
                        e.preventDefault();
                        return;
                    } else {
                        ingestionReset();
                    }
                }}
            />
        </Box>
    );
}

export default SubjectItem;