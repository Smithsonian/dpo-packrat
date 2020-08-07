import { Box, Chip } from '@material-ui/core';
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
}));

function SubjectItem(): React.ReactElement {
    const classes = useStyles();
    const history = useHistory();
    const { ingestion: { metadata, subject: { subjects } } } = useContext(AppContext);
    const { getSelectedItem } = useItem();
    const [subjectError, setSubjectError] = useState(false);
    const [itemError, setItemError] = useState(false);

    useEffect(() => {
        if (subjects.length > 0) {
            setSubjectError(false);
        }
    }, [subjects]);

    const onNext = (): void => {
        if (!subjects.length) {
            setSubjectError(true);
            toast.warn('Please resolve issue for subject');
            return;
        }

        const selectedItem = getSelectedItem();

        if (!selectedItem) {
            setItemError(true);
            toast.warn('Please select or provide an item');
            return;
        }

        const { file: { id, type } } = metadata[0];
        const nextRoute = resolveSubRoute(HOME_ROUTES.INGESTION, `${INGESTION_ROUTE.ROUTES.METADATA}?fileId=${id}&type=${type}`);

        history.push(nextRoute);
    };

    const metadataLength = metadata.length;

    if (!metadataLength) {
        return <Redirect to={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.UPLOADS)} />;
    }

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                <Box>
                    {metadata.map(({ file }, index) => <Chip key={index} style={{ marginRight: 10 }} label={file.name} variant='outlined' />)}
                </Box>
                <SearchList />
                <FieldType error={subjectError} required label='Subject(s) Selected' marginTop={2}>
                    <SubjectList subjects={subjects} selected emptyLabel='Search and select subject from above' />
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