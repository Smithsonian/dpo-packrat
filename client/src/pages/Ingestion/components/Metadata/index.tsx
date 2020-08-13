/* eslint-disable no-var */
import { Box, Breadcrumbs, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import * as qs from 'query-string';
import React, { useContext } from 'react';
import { MdNavigateNext } from 'react-icons/md';
import { Redirect, useHistory, useLocation } from 'react-router';
import { toast } from 'react-toastify';
import { SidebarBottomNavigator } from '../../../../components';
import { HOME_ROUTES, INGESTION_ROUTE, resolveSubRoute } from '../../../../constants';
import { AppContext, AssetType, FileId, StateItem, StateMetadata, StateProject } from '../../../../context';
import useItem from '../../hooks/useItem';
import useMetadata from '../../hooks/useMetadata';
import useProject from '../../hooks/useProject';
import Photogrammetry from './Photogrammetry';

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

type QueryParams = {
    fileId: FileId;
    type: AssetType;
};

function Metadata(): React.ReactElement {
    const classes = useStyles();
    const { search } = useLocation();
    const { ingestion } = useContext(AppContext);
    const { metadatas } = ingestion;
    const history = useHistory();

    const { getSelectedProject } = useProject();
    const { getSelectedItem } = useItem();
    const { getFieldErrors, getMetadataInfo } = useMetadata();

    const metadataLength = metadatas.length;
    const query = qs.parse(search) as QueryParams;
    const { fileId, type } = query;

    if (!metadataLength || !fileId) {
        return <Redirect to={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.UPLOADS)} />;
    }

    const { metadata, metadataIndex, isLast } = getMetadataInfo(fileId);
    const project = getSelectedProject();
    const item = getSelectedItem();

    const onPrevious = () => {
        history.goBack();
    };

    const onNext = () => {
        const { photogrammetry } = getFieldErrors(metadata);
        let hasError: boolean = false;

        for (const fieldValue of Object.values(photogrammetry)) {
            if (fieldValue) {
                hasError = true;
            }
        }

        if (hasError) {
            toast.warn('Please address all the errors');
            return;
        }

        if (isLast) {
            console.log(metadatas);
            alert('Finished');
        } else {
            const nextMetadata = metadatas[metadataIndex + 1];
            const { file: { id, type } } = nextMetadata;
            const nextRoute = resolveSubRoute(HOME_ROUTES.INGESTION, `${INGESTION_ROUTE.ROUTES.METADATA}?fileId=${id}&type=${type}`);

            history.push(nextRoute);
        }
    };

    const getMetadataComponent = (metadataIndex: number): React.ReactElement | null => {
        if (type === AssetType.Photogrammetry) {
            return <Photogrammetry metadataIndex={metadataIndex} />;
        }

        return null;
    };

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                <BreadcrumbsHeader project={project} item={item} metadata={metadata} />
                {getMetadataComponent(metadataIndex)}
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

interface BreadcrumbsHeaderProps {
    project: StateProject | undefined;
    item: StateItem | undefined;
    metadata: StateMetadata
}

function BreadcrumbsHeader(props: BreadcrumbsHeaderProps) {
    const classes = useStyles();
    const { project, item, metadata } = props;

    return (
        <Breadcrumbs className={classes.breadcrumbs} separator={<MdNavigateNext color='inherit' size={20} />}>
            <Typography color='inherit'>Specify metadata for: {project?.name}</Typography>
            <Typography color='inherit'>{item?.name}</Typography>
            <Typography color='inherit'>{metadata.file.name}</Typography>
        </Breadcrumbs>
    );
}

export default Metadata;