import { Box, Breadcrumbs, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import * as qs from 'query-string';
import React, { useState } from 'react';
import { MdNavigateNext } from 'react-icons/md';
import { Redirect, useHistory, useLocation } from 'react-router';
import { toast } from 'react-toastify';
import { SidebarBottomNavigator } from '../../../../components';
import { HOME_ROUTES, INGESTION_ROUTE, resolveSubRoute } from '../../../../constants';
import { useItem, useMetadata, useProject, useVocabulary, FileId, StateItem, StateMetadata, StateProject } from '../../../../store';
import useIngest from '../../hooks/useIngest';
import Photogrammetry from './Photogrammetry';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
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
        width: '50vw',
        padding: 40,
        paddingBottom: 0,
        [breakpoints.down('lg')]: {
            padding: 20,
            paddingBottom: 0,
        }
    },
    breadcrumbs: {
        marginBottom: 10,
        color: palette.primary.dark
    }
}));

type QueryParams = {
    fileId: FileId;
    type: string;
};

function Metadata(): React.ReactElement {
    const classes = useStyles();
    const { search } = useLocation();
    const history = useHistory();

    const [ingestionLoading, setIngestionLoading] = useState(false);

    const getSelectedProject = useProject(state => state.getSelectedProject);
    const getSelectedItem = useItem(state => state.getSelectedItem);
    const [metadatas, getFieldErrors, getMetadataInfo] = useMetadata(state => [state.metadatas, state.getFieldErrors, state.getMetadataInfo]);
    const { ingestPhotogrammetryData, ingestionComplete } = useIngest();
    const getAssetType = useVocabulary(state => state.getAssetType);

    const metadataLength = metadatas.length;
    const query = qs.parse(search) as QueryParams;
    const { fileId, type } = query;

    if (!metadataLength || !fileId) {
        return <Redirect to={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.UPLOADS)} />;
    }

    const { metadata, metadataIndex, isLast } = getMetadataInfo(fileId);
    const project = getSelectedProject();
    const item = getSelectedItem();
    const assetType = getAssetType(Number.parseInt(type, 10));

    const onPrevious = () => {
        history.goBack();
    };

    const onNext = async () => {
        if (assetType.photogrammetry) {
            const { photogrammetry } = getFieldErrors(metadata);
            const { photogrammetry: { datasetType, description, systemCreated, identifiers } } = metadata;
            let hasError: boolean = false;

            if (!datasetType) {
                toast.warn('Please select a valid dataset type', { autoClose: false });
            }

            if (!systemCreated) {
                hasError = true;
            }

            identifiers.forEach(({ identifier, selected }) => {
                if (selected) {
                    hasError = false;
                    if (identifier.trim() === '') {
                        toast.warn('Please provide a valid identifier', { autoClose: false });
                        hasError = true;
                    }
                }
            });

            if (hasError && !systemCreated) {
                toast.warn('Should select/provide at least 1 identifier', { autoClose: false });
            }

            if (description.trim() === '') {
                toast.warn('Description cannot be empty', { autoClose: false });
                hasError = true;
            }

            for (const fieldValue of Object.values(photogrammetry)) {
                if (fieldValue) {
                    hasError = true;
                }
            }

            if (hasError) return;
        }

        if (isLast) {
            setIngestionLoading(true);
            const success: boolean = await ingestPhotogrammetryData();
            setIngestionLoading(false);

            if (success) {
                toast.success('Ingestion complete');
                ingestionComplete();
            } else {
                toast.error('Ingestion failed, please try again later');
            }
        } else {
            const nextMetadata = metadatas[metadataIndex + 1];
            const { file: { id, type } } = nextMetadata;
            const nextRoute = resolveSubRoute(HOME_ROUTES.INGESTION, `${INGESTION_ROUTE.ROUTES.METADATA}?fileId=${id}&type=${type}`);

            history.push(nextRoute);
        }
    };

    const getMetadataComponent = (metadataIndex: number): React.ReactNode => {
        if (assetType.photogrammetry) {
            return <Photogrammetry metadataIndex={metadataIndex} />;
        }

        return (
            <Box display='flex' flex={1} alignItems='center' justifyContent='center'>
                <Typography variant='subtitle1' color='primary'>Metadata type not yet implemented</Typography>
            </Box>
        );
    };

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                <BreadcrumbsHeader project={project} item={item} metadata={metadata} />
                {getMetadataComponent(metadataIndex)}
            </Box>
            <SidebarBottomNavigator
                rightLoading={ingestionLoading}
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