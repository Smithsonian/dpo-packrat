/* eslint-disable react/jsx-max-props-per-line */

/**
 * Metadata
 *
 * This component renders the metadata specific components for Ingestion UI.
 */
import { Box, Breadcrumbs, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import * as qs from 'query-string';
import React, { useState, useEffect } from 'react';
import { MdNavigateNext } from 'react-icons/md';
import { Redirect, useHistory, useLocation } from 'react-router';
import { toast } from 'react-toastify';
import { SidebarBottomNavigator } from '../../../../components';
import { HOME_ROUTES, INGESTION_ROUTE, resolveSubRoute } from '../../../../constants';
import {
    FileId,
    photogrammetryFieldsSchema,
    photogrammetryFieldsSchemaUpdate,
    modelFieldsSchema,
    modelFieldsSchemaUpdate,
    sceneFieldsSchema,
    sceneFieldsSchemaUpdate,
    otherFieldsSchema,
    otherFieldsSchemaUpdate,
    StateItem,
    StateMetadata,
    useItemStore,
    useMetadataStore,
    useVocabularyStore,
    useUploadStore
} from '../../../../store';
import useIngest from '../../hooks/useIngest';
import Model from './Model';
import Other from './Other';
import Photogrammetry from './Photogrammetry';
import Scene from './Scene';
import Attachment from './Attachment';
import { Helmet } from 'react-helmet';
import { apolloClient } from '../../../../graphql';
import { GetSystemObjectDetailsDocument } from '../../../../types/graphql';

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
    const location = useLocation();
    const history = useHistory();
    const [ingestionLoading, setIngestionLoading] = useState(false);
    const [disableNavigation, setDisableNavigation] = useState(false);
    const [invalidMetadataStep, setInvalidMetadataStep] = useState<boolean>(false);
    const [breadcrumbNames, setBreadcrumbNames] = useState<string[]>([]);

    const getSelectedItem = useItemStore(state => state.getSelectedItem);
    const [metadatas, getMetadataInfo, validateFields] = useMetadataStore(state => [state.metadatas, state.getMetadataInfo, state.validateFields]);
    const { ingestionStart, ingestionComplete } = useIngest();
    const getAssetType = useVocabularyStore(state => state.getAssetType);
    const [setUpdateMode] = useUploadStore(state => [state.setUpdateMode]);
    const metadataLength = metadatas.length;
    const query = qs.parse(location.search) as QueryParams;
    const { fileId, type } = query;
    const { metadata, metadataIndex, isLast } = getMetadataInfo(fileId);

    useEffect(() => {
        const fetchAndSetBreadcrumbName = async () => {
            // attachment case
            if (metadatas[metadataIndex]?.file?.idSOAttachment) {
                const { data: { getSystemObjectDetails: { name: parentName } } } = await apolloClient.query({
                    query: GetSystemObjectDetailsDocument,
                    variables: {
                        input: {
                            idSystemObject: metadatas[metadataIndex].file.idSOAttachment
                        }
                    }
                });
                // set breadcrumb name to attachment parent
                setBreadcrumbNames([parentName ?? 'Unknown', `Attachment ${metadatas[metadataIndex]?.file?.name}`]);
            } else if (metadatas[metadataIndex]?.file?.idAsset) {
                // update case
                setBreadcrumbNames([metadatas[metadataIndex]?.file?.name]);
            } else {
                setBreadcrumbNames([]);
            }
        };
        fetchAndSetBreadcrumbName();
    }, [metadatas, metadataIndex]);

    if (!metadataLength || !fileId) {
        return <Redirect to={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.UPLOADS)} />;
    }

    const item = getSelectedItem();
    const project = item?.projectName;
    const assetType = getAssetType(Number.parseInt(type, 10));

    const onPrevious = async () => {
        toast.dismiss();
        await history.goBack();
    };

    const onNext = async (): Promise<void> => {
        const updateMode: boolean = !!(metadata.file.idAsset);
        if (assetType.photogrammetry) {
            const hasError: boolean = updateMode
                ? validateFields(metadata.photogrammetry, photogrammetryFieldsSchemaUpdate)
                : validateFields(metadata.photogrammetry, photogrammetryFieldsSchema);
            if (hasError) return;
        }

        if (assetType.model) {
            const hasError: boolean = updateMode
                ? validateFields(metadata.model, modelFieldsSchemaUpdate)
                : validateFields(metadata.model, modelFieldsSchema);
            if (hasError) return;
        }

        if (assetType.scene) {
            const hasError: boolean = updateMode
                ? validateFields(metadata.scene, sceneFieldsSchemaUpdate)
                : validateFields(metadata.scene, sceneFieldsSchema);
            if (hasError) return;
        }

        if (assetType.other) {
            const hasError: boolean = updateMode
                ? validateFields(metadata.other, otherFieldsSchemaUpdate)
                : validateFields(metadata.other, otherFieldsSchema);
            if (hasError) return;
        }

        if (isLast) {
            setDisableNavigation(true);
            setIngestionLoading(true);
            const { success, message } = await ingestionStart();
            setIngestionLoading(false);

            if (success) {
                toast.success('Ingestion complete');
                ingestionComplete();
                setUpdateMode(false);
            } else {
                setDisableNavigation(false);
                toast.error(`Ingestion failed, please try again later. Error: ${message}`);
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
            return <Scene metadataIndex={metadataIndex} setInvalidMetadataStep={setInvalidMetadataStep} />;
        }

        if (assetType.model) {
            // Model takes in additional props for onPrevious, onClickRight, isLast, and rightLoading because it imports an additional copy of <SidebarBottomNavigator />
            return <Model metadataIndex={metadataIndex} onPrevious={onPrevious} onClickRight={onNext} isLast={isLast} rightLoading={ingestionLoading} disableNavigation={disableNavigation} />;
        }

        if (assetType.attachment) {
            return <Attachment metadataIndex={metadataIndex} />;
        }

        return <Other metadataIndex={metadataIndex} />;
    };

    const calculateBreadcrumbPath = (): React.ReactNode => {
        if (breadcrumbNames) {
            return <BreadcrumbsHeader projectName={project} item={item} metadata={metadata} customBreadcrumbs customBreadcrumbsArr={breadcrumbNames} />;
        } else {
            return <BreadcrumbsHeader projectName={project} item={item} metadata={metadata} />;
        }
    };

    return (
        <Box className={classes.container}>
            <Helmet>
                <title>Metadata Ingestion</title>
            </Helmet>
            <Box className={classes.content}>
                {calculateBreadcrumbPath()}
                {getMetadataComponent(metadataIndex)}
            </Box>
            <SidebarBottomNavigator
                rightLoading={ingestionLoading}
                leftLabel='Previous'
                onClickLeft={onPrevious}
                rightLabel={isLast ? 'Finish' : 'Next'}
                onClickRight={onNext}
                invalidMetadataStep={invalidMetadataStep}
                disableNavigation={disableNavigation}
            />
        </Box>
    );
}

interface BreadcrumbsHeaderProps {
    projectName: string | undefined;
    item: StateItem | undefined;
    metadata: StateMetadata;
    customBreadcrumbs?: boolean;
    customBreadcrumbsArr?: string[];
}

function BreadcrumbsHeader(props: BreadcrumbsHeaderProps) {
    const classes = useStyles();
    const { projectName, item, metadata, customBreadcrumbs, customBreadcrumbsArr } = props;

    let content: React.ReactNode;

    if (customBreadcrumbs && customBreadcrumbsArr?.length) {
        const crumbs: React.ReactNode[] = [];
        for (let i = 1; i < customBreadcrumbsArr.length; i++) {
            crumbs.push(<Typography key={i} color='inherit'>{customBreadcrumbsArr[i]}</Typography>);
        }
        content = (
            <Breadcrumbs className={classes.breadcrumbs} separator={<MdNavigateNext color='inherit' size={20} />}>
                <Typography key={0} color='inherit'>Specify metadata for {customBreadcrumbsArr[0]}</Typography>
                {crumbs}
            </Breadcrumbs>
        );
    } else {
        content = (
            <Breadcrumbs className={classes.breadcrumbs} separator={<MdNavigateNext color='inherit' size={20} />}>
                <Typography color='inherit'>Specify metadata for: Project: {projectName}</Typography>
                <Typography color='inherit'>Media Group: {item?.subtitle}</Typography>
                <Typography color='inherit'>{metadata.file.name}</Typography>
            </Breadcrumbs>
        );
    }

    return (
        <>
            {content}
        </>
    );
}

export default Metadata;
