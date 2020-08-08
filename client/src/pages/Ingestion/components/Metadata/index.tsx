import React, { useContext } from 'react';
import { Box, Typography, Breadcrumbs } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { resolveSubRoute, INGESTION_ROUTE, HOME_ROUTES } from '../../../../constants';
import { SidebarBottomNavigator } from '../../../../components';
import { useLocation, Redirect, useHistory } from 'react-router';
import { AppContext, FileId } from '../../../../context';
import * as qs from 'query-string';
import useMetadata from '../../hooks/useMetadata';
import useProject from '../../hooks/useProject';
import useItem from '../../hooks/useItem';
import { MdNavigateNext } from 'react-icons/md';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column'
    },
    content: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        width: '50vw',
        padding: '40px 0px 0px 40px'
    },
    breadcrumbs: {
        marginBottom: 10,
        color: palette.primary.dark
    }
}));

function Metadata(): React.ReactElement {
    const classes = useStyles();
    const { search } = useLocation();
    const { ingestion } = useContext(AppContext);
    const { metadatas } = ingestion;
    const history = useHistory();

    const { getSelectedProject } = useProject();
    const { getSelectedItem } = useItem();
    const { getMetadataInfo } = useMetadata();

    const metadataLength = metadatas.length;
    const query = qs.parse(search);

    if (!metadataLength || !query.fileId) {
        return <Redirect to={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.UPLOADS)} />;
    }

    const { metadata, metadataIndex, isLast } = getMetadataInfo(query.fileId as FileId);
    const project = getSelectedProject();
    const item = getSelectedItem();

    const onPrevious = () => {
        history.goBack();
    };

    const onNext = () => {
        if (isLast) {
            alert('Finished');
        } else {
            const { file: { id, type } } = metadatas[metadataIndex + 1];
            const nextRoute = resolveSubRoute(HOME_ROUTES.INGESTION, `${INGESTION_ROUTE.ROUTES.METADATA}?fileId=${id}&type=${type}`);

            history.push(nextRoute);
        }
    };

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                <Breadcrumbs className={classes.breadcrumbs} separator={<MdNavigateNext color='inherit' size={20} />}>
                    <Typography color='inherit'>Specify metadata for: {project?.name}</Typography>
                    <Typography color='inherit'>{item?.name}</Typography>
                    <Typography color='inherit'>{metadata?.file?.name}</Typography>
                </Breadcrumbs>
            </Box>
            <SidebarBottomNavigator
                leftLabel='Previous'
                onClickLeft={onPrevious}
                rightLabel={isLast ? 'Finish' : 'Next'}
                onClickRight={onNext}
            />
        </Box>
    );
}

export default Metadata;