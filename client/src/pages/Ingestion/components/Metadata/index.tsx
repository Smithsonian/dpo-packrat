/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react-hooks/exhaustive-deps */

/**
 * Metadata
 *
 * This component renders the metadata specific components for Ingestion UI.
 */
import { Box, Breadcrumbs, Typography } from '@material-ui/core';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import * as qs from 'query-string';
import React, { useState, useEffect } from 'react';
import { MdNavigateNext } from 'react-icons/md';
import { Navigate, useNavigate, useLocation } from 'react-router';
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
    useSubjectStore,
    FieldErrors,
    AssetType
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
import { eSystemObjectType } from '@dpo-packrat/common';
import { Loader } from '../../../../components';

const useStyles = makeStyles(({ palette }) => createStyles({
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
    const navigate = useNavigate();
    const [ingestionLoading, setIngestionLoading] = useState(false);
    const [disableNavigation, setDisableNavigation] = useState(false);
    const [invalidMetadataStep, setInvalidMetadataStep] = useState<boolean>(false);
    const [loadingAssetType, setLoadingAssetType] = useState<boolean>(true);
    const [breadcrumbNames, setBreadcrumbNames] = useState<string[]>([]);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>();
    const [assetType, setAssetType] = useState<AssetType>({ photogrammetry: false, model: false, scene: false, attachment: false, other: false });
    const getSelectedItem = useItemStore(state => state.getSelectedItem);
    const [metadatas, getMetadataInfo, validateFields, getFieldErrors] = useMetadataStore(state => [state.metadatas, state.getMetadataInfo, state.validateFields, state.getFieldErrors]);
    const { ingestionStart, ingestionComplete } = useIngest();
    const getAssetType = useVocabularyStore(state => state.getAssetType);
    const metadataLength = metadatas.length;
    const query = qs.parse(location.search) as QueryParams;
    const { fileId, type } = query;
    const { metadata, metadataIndex, isLast } = getMetadataInfo(fileId);

    useEffect(() => {
        const fetchAndSetBreadcrumbName = async () => {
            const metadata = metadatas[metadataIndex]?.file;

            // we only want to fetch if it's a system object (ie for attachment or updates)
            // otherwise a fresh ingestion will not have an existing system object to fetch
            if (metadata && (metadata.idSOAttachment || metadata.idAsset)) {
                const { data: { getSystemObjectDetails: { objectType, name: parentName } } } = await apolloClient.query({
                    query: GetSystemObjectDetailsDocument,
                    variables: {
                        input: {
                            idSystemObject: metadatas[metadataIndex].file.idSOAttachment
                        }
                    }
                });
                if (metadata.idSOAttachment && metadata.idAsset) {
                    switch (objectType) {
                        case eSystemObjectType.eCaptureData: {
                            setAssetType({
                                ...assetType,
                                photogrammetry: true
                            });
                            break;
                        } case eSystemObjectType.eModel: {
                            setAssetType({
                                ...assetType,
                                model: true
                            });
                            break;
                        } case eSystemObjectType.eScene: {
                            setAssetType({
                                ...assetType,
                                scene: true
                            });
                            break;
                        } default: {
                            setAssetType({
                                ...assetType,
                                other: true
                            });
                        }
                    }
                    setBreadcrumbNames([metadatas[metadataIndex]?.file?.name]);
                } else if (metadata.idSOAttachment) {
                    setAssetType(getAssetType(Number.parseInt(type, 10)));
                    setBreadcrumbNames([parentName ?? 'Unknown', `Attachment ${metadatas[metadataIndex]?.file?.name}`]);
                }
            } else {
                setAssetType(getAssetType(Number.parseInt(type, 10)));
                setBreadcrumbNames([]);
            }
            setLoadingAssetType(false);
        };
        fetchAndSetBreadcrumbName();
    }, [metadatas, metadataIndex]);

    if (!metadataLength || !fileId) {
        return <Navigate to={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.UPLOADS)} />;
    }

    if (loadingAssetType)
        return <Loader minHeight='15vh' />;

    const item = getSelectedItem();
    const project = item?.projectName;

    const onPrevious = async () => {
        toast.dismiss();
        await navigate(-1);
    };

    const onNext = async (): Promise<void> => {
        const updateMode: boolean = !!(metadata.file.idAsset);
        setFieldErrors(getFieldErrors(metadata));

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
            navigate(nextRoute);
        }
    };

    const getMetadataComponent = (metadataIndex: number): React.ReactNode => {
        if (assetType.photogrammetry) {
            return <Photogrammetry metadataIndex={metadataIndex} />;
        }

        if (assetType.scene) {
            return <Scene metadataIndex={metadataIndex} setInvalidMetadataStep={setInvalidMetadataStep} fieldErrors={fieldErrors} />;
        }

        if (assetType.model) {
            return <Model metadataIndex={metadataIndex} fieldErrors={fieldErrors} />;
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
    const [subjects] = useSubjectStore(state => [state.subjects]);
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
                {/*
                    Case 1: more than 1 subject - show entered name
                    Case 2: existing item is selected - show full name of that item
                    Case 3: new item w/o subtitle - [subject]: [subtitle]
                    Case 4: new item w/ subtitle - [subject]
                */}
                <Typography color='inherit'>Media Group: {subjects.length > 1 ? item?.subtitle : item?.id === 'default' ? `${subjects?.[0]?.name}${item?.subtitle ? `: ${item?.subtitle}` : ''}` : item?.subtitle}</Typography>
                <Typography color='inherit'>{metadata?.file?.name}</Typography>
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
