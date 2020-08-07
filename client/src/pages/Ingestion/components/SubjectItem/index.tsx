import { Box, Chip, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useContext, useEffect, useState } from 'react';
import { Redirect, useHistory } from 'react-router';
import { toast } from 'react-toastify';
import { FieldType, SidebarBottomNavigator } from '../../../../components';
import { HOME_ROUTES, INGESTION_ROUTE, resolveSubRoute } from '../../../../constants';
import { AppContext } from '../../../../context';
import useItem from '../../hooks/useItem';
import ItemList from './ItemList';
import SearchList from './SearchList';
import SubjectList from './SubjectList';
import ProjectList from './ProjectList';
import useProject from '../../hooks/useProject';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column'
    },
    content: {
        display: 'flex',
        flex: 1,
        width: '50vw',
        flexDirection: 'column',
        padding: '40px 0px 0px 40px'
    },
    filesLabel: {
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
    const { ingestion: { metadatas, subjects, projects } } = useContext(AppContext);
    const { getSelectedProject } = useProject();
    const { getSelectedItem } = useItem();
    const [subjectError, setSubjectError] = useState(false);
    const [projectError, setProjectError] = useState(false);
    const [itemError, setItemError] = useState(false);

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

    const onNext = (): void => {
        let error: boolean = false;

        if (!subjects.length) {
            error = true;
            setSubjectError(true);
            toast.warn('Please provide at least one subject');
        }

        const selectedProject = getSelectedProject();

        if (!selectedProject) {
            error = true;
            setProjectError(true);
            toast.warn('Please select a project');
        }

        const selectedItem = getSelectedItem();

        if (!selectedItem) {
            error = true;
            setItemError(true);
            toast.warn('Please select or provide an item');
        }

        if (error) return;

        const { file: { id, type } } = metadatas[0];
        const nextRoute = resolveSubRoute(HOME_ROUTES.INGESTION, `${INGESTION_ROUTE.ROUTES.METADATA}?fileId=${id}&type=${type}`);

        history.push(nextRoute);
    };

    const metadataLength = metadatas.length;

    if (!metadataLength) {
        return <Redirect to={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.UPLOADS)} />;
    }

    return (
        <Box className={classes.container}>
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
                    width={'40%'}
                    required
                    label='Project'
                    marginTop={2}
                >
                    <ProjectList />
                </FieldType>

                <FieldType error={itemError} required label='Item' marginTop={2}>
                    <ItemList />
                </FieldType>
            </Box>
            <SidebarBottomNavigator
                leftLabel='Previous'
                leftRoute={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.UPLOADS)}
                rightLabel='Next'
                onClickRight={onNext}
            />
        </Box>
    );
}

export default SubjectItem;