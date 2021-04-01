/**
 * Metadata
 *
 * This component renders the metadata specific components for Ingestion UI.
 */
import { Box, Breadcrumbs, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import * as qs from 'query-string';
import React, { useState } from 'react';
import { MdNavigateNext } from 'react-icons/md';
import { Redirect, useHistory, useLocation } from 'react-router';
import { toast } from 'react-toastify';
import { SidebarBottomNavigator } from '../../../../components';
import { HOME_ROUTES, INGESTION_ROUTE, resolveSubRoute } from '../../../../constants';
import {
    FileId,
    modelFieldsSchema,
    otherFieldsSchema,
    photogrammetryFieldsSchema,
    sceneFieldsSchema,
    StateItem,
    StateMetadata,
    StateProject,
    useItemStore,
    useMetadataStore,
    useProjectStore,
    useVocabularyStore
} from '../../../../store';
import useIngest from '../../hooks/useIngest';
import Model from './Model';
import Other from './Other';
import Photogrammetry from './Photogrammetry';
import Scene from './Scene';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto'
    },
    content: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        width: '52vw',
        padding: 20,
        paddingBottom: 0
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

    const getSelectedProject = useProjectStore(state => state.getSelectedProject);
    const getSelectedItem = useItemStore(state => state.getSelectedItem);
    const [metadatas, getMetadataInfo, validateFields] = useMetadataStore(state => [state.metadatas, state.getMetadataInfo, state.validateFields]);
    const { ingestionStart, ingestionComplete } = useIngest();
    const getAssetType = useVocabularyStore(state => state.getAssetType);

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
        toast.dismiss();
        history.goBack();
    };

    const onNext = async (): Promise<void> => {
        if (assetType.photogrammetry) {
            const hasError: boolean = validateFields(metadata.photogrammetry, photogrammetryFieldsSchema);
            if (hasError) return;
        }

        if (assetType.model) {
            const hasError: boolean = validateFields(metadata.model, modelFieldsSchema);
            if (hasError) return;
        }

        if (assetType.scene) {
            const hasError: boolean = validateFields(metadata.scene, sceneFieldsSchema);
            if (hasError) return;
        }

        if (assetType.other) {
            const hasError: boolean = validateFields(metadata.other, otherFieldsSchema);
            if (hasError) return;
        }

        if (isLast) {
            setIngestionLoading(true);
            const success: boolean = await ingestionStart();
            setIngestionLoading(false);

            if (success) {
                toast.success('Ingestion complete');
                ingestionComplete();
            } else {
                toast.error('Ingestion failed, please try again later');
            }
        } else {
            const nextMetadata = metadatas[metadataIndex + 1];
            const {
                file: { id, type }
            } = nextMetadata;
            const { isLast } = getMetadataInfo(id);
            const nextRoute = resolveSubRoute(HOME_ROUTES.INGESTION, `${INGESTION_ROUTE.ROUTES.METADATA}?fileId=${id}&type=${type}&last=${isLast}`);
            history.push(nextRoute);
        }
    };

    const getMetadataComponent = (metadataIndex: number): React.ReactNode => {
        if (assetType.photogrammetry) {
            return <Photogrammetry metadataIndex={metadataIndex} />;
        }

        if (assetType.scene) {
            return <Scene metadataIndex={metadataIndex} />;
        }

        if (assetType.model) {
            return <Model metadataIndex={metadataIndex} />;
        }

        return <Other metadataIndex={metadataIndex} />;
    };

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                <BreadcrumbsHeader project={project} item={item} metadata={metadata} />
                {getMetadataComponent(metadataIndex)}
            </Box>
            <SidebarBottomNavigator rightLoading={ingestionLoading} leftLabel='Previous' onClickLeft={onPrevious} rightLabel={isLast ? 'Finish' : 'Next'} onClickRight={onNext} />
        </Box>
    );
}

interface BreadcrumbsHeaderProps {
    project: StateProject | undefined;
    item: StateItem | undefined;
    metadata: StateMetadata;
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
