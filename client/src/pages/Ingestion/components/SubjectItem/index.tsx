/**
 * SubjectItem
 *
 * This component renders the subject and item specific components for Ingestion UI.
 */
import { Box, Chip, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { Redirect, useHistory } from 'react-router';
import { toast } from 'react-toastify';
import { FieldType, SidebarBottomNavigator } from '../../../../components';
import { HOME_ROUTES, INGESTION_ROUTE, resolveSubRoute } from '../../../../constants';
import { useItemStore, useMetadataStore, useProjectStore, useSubjectStore, useVocabularyStore } from '../../../../store';
import ItemList from './ItemList';
import ProjectList from './ProjectList';
import SearchList from './SearchList';
import SubjectList from './SubjectList';
import { Helmet } from 'react-helmet';

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
        width: '52vw',
        flexDirection: 'column',
        padding: 20,
        paddingBottom: 0
    },
    filesLabel: {
        color: palette.primary.dark,
        marginRight: 20
    },
    fileChip: {
        marginRight: 10,
        marginBottom: 5
    }
}));

function SubjectItem(): React.ReactElement {
    const classes = useStyles();
    const history = useHistory();

    const [subjectError, setSubjectError] = useState(false);
    const [projectError, setProjectError] = useState(false);
    const [itemError, setItemError] = useState(false);
    const [metadataStepLoading, setMetadataStepLoading] = useState(false);

    const updateVocabularyEntries = useVocabularyStore(state => state.updateVocabularyEntries);
    const subjects = useSubjectStore(state => state.subjects);
    const [projects, projectsLoading, getSelectedProject] = useProjectStore(state => [state.projects, state.loading, state.getSelectedProject]);
    const [itemsLoading, getSelectedItem] = useItemStore(state => [state.loading, state.getSelectedItem]);
    const [metadatas, updateMetadataFolders, getMetadataInfo] = useMetadataStore(state => [state.metadatas, state.updateMetadataFolders, state.getMetadataInfo]);

    const selectedItem = getSelectedItem();

    useEffect(() => {
        if (subjects.length > 0) {
            setSubjectError(false);
        }
    }, [subjects]);

    useEffect(() => {
        if (projects.length > 0) {
            setProjectError(false);
        }
    }, [projects]);

    useEffect(() => {
        if (selectedItem) {
            if (selectedItem.name.length) {
                setItemError(false);
            }
        }
    }, [selectedItem]);

    const onNext = async (): Promise<void> => {
        let error: boolean = false;

        if (!subjects.length) {
            error = true;
            setSubjectError(true);
            toast.warn('Please provide at least one subject', { autoClose: false });
        }

        const selectedProject = getSelectedProject();

        if (!selectedProject) {
            error = true;
            setProjectError(true);
            toast.warn('Please select a project', { autoClose: false });
        }

        if (!selectedItem) {
            error = true;
            setItemError(true);
            toast.warn('Please select or provide an item', { autoClose: false });
        }

        if (selectedItem?.name.trim() === '') {
            error = true;
            setItemError(true);
            toast.warn('Please provide a valid name for item', { autoClose: false });
        }

        if (error) return;

        try {
            setMetadataStepLoading(true);
            await updateVocabularyEntries();
            await updateMetadataFolders();
            setMetadataStepLoading(false);
        } catch (error) {
            toast.error(error);
            setMetadataStepLoading(false);
            return;
        }

        const { file: { id, type } } = metadatas[0];
        const { isLast } = getMetadataInfo(id);
        const nextRoute = resolveSubRoute(HOME_ROUTES.INGESTION, `${INGESTION_ROUTE.ROUTES.METADATA}?fileId=${id}&type=${type}&last=${isLast}`);
        toast.dismiss();
        history.push(nextRoute);
    };

    const metadataLength = metadatas.length;

    if (!metadataLength) {
        return <Redirect to={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.UPLOADS)} />;
    }

    return (
        <Box className={classes.container}>
            <Helmet>
                <title>Subect/Item | Ingestion</title>
            </Helmet>
            <Box className={classes.content}>
                <Box display='flex' flexDirection='row' alignItems='center' flexWrap='wrap'>
                    <Typography className={classes.filesLabel}>Select Subject and Item for:</Typography>
                    {metadatas.map(({ file }, index) => <Chip key={index} className={classes.fileChip} label={file.name} variant='outlined' />)}
                </Box>
                <SearchList />
                <FieldType error={subjectError} required label='Subject(s) Selected' marginTop={2}>
                    <SubjectList subjects={subjects} selected emptyLabel='Search and select subject from above' />
                </FieldType>

                <FieldType
                    error={projectError}
                    loading={projectsLoading}
                    width={'40%'}
                    required
                    label='Project'
                    marginTop={2}
                >
                    <ProjectList />
                </FieldType>

                <FieldType
                    loading={itemsLoading}
                    error={itemError}
                    required
                    label='Item'
                    marginTop={2}
                >
                    <ItemList />
                </FieldType>
            </Box>
            <SidebarBottomNavigator
                rightLoading={metadataStepLoading}
                leftLabel='Previous'
                rightLabel='Next'
                leftRoute={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.UPLOADS)}
                onClickRight={onNext}
            />
        </Box>
    );
}

export default SubjectItem;