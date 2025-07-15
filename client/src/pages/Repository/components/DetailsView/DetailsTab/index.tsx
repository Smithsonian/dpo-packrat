/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * DetailsTab
 *
 * This component renders details tab for the DetailsView component.
 */
import { Box, Tab, TabProps, Tabs, Button, Typography } from '@material-ui/core';
import { fade, makeStyles, withStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { StateRelatedObject, eObjectMetadataType, UploadReferences } from '../../../../../store';
import {
    ActorDetailFieldsInput,
    AssetDetailFieldsInput,
    RelatedObjectType,
    ProjectDetailFieldsInput,
    SubjectDetailFieldsInput,
    ItemDetailFieldsInput,
    CaptureDataDetailFieldsInput,
    ModelDetailFieldsInput,
    SceneDetailFieldsInput,
    ProjectDocumentationDetailFieldsInput,
    AssetVersionDetailFieldsInput,
    StakeholderDetailFieldsInput,
    GetDetailsTabDataForObjectQueryResult,
    UnitDetailFieldsInput,
    SystemObjectVersion,
    RepositoryPath,
    Metadata
} from '../../../../../types/graphql';
import { eSystemObjectType } from '@dpo-packrat/common';
import RelatedObjectsList from '../../../../Ingestion/components/Metadata/Model/RelatedObjectsList';
import ActorDetails from './ActorDetails';
import AssetDetails from './AssetDetails';
import AssetVersionDetails from './AssetVersionDetails';
import AssetVersionsTable from './AssetVersionsTable';
import CaptureDataDetails from './CaptureDataDetails';
import IntermediaryFileDetails from './IntermediaryFileDetails';
import ItemDetails from './ItemDetails';
import ModelDetails from './ModelDetails';
import ProjectDetails from './ProjectDetails';
import ProjectDocumentationDetails from './ProjectDocumentationDetails';
import SceneDetails from './SceneDetails';
import StakeholderDetails from './StakeholderDetails';
import SubjectDetails from './SubjectDetails';
import UnitDetails from './UnitDetails';
import ObjectVersionTable from './ObjectVersionTable';
import { deleteObjectConnection } from '../../../hooks/useDetailsView';
import { sharedButtonProps } from '../../../../../utils/shared';
import { getDetailsUrlForObject, getTermForSystemObjectType } from '../../../../../utils/repository';
import { NewTabLink } from '../../../../../components';
import { eIngestionMode } from '../../../../../constants';
import AssetGrid from './AssetGrid';
import MetadataControlTable from './MetadataControlTable';
import MetadataDisplayTable from './MetadataDisplayTable';

const useStyles = makeStyles(({ palette }) => ({
    tab: {
        backgroundColor: fade(palette.primary.main, 0.25),
    },
    tabpanel: {
        backgroundColor: fade(palette.primary.main, 0.25),
    },
    assetOwner: {
        display: 'flex',
        backgroundColor: palette.primary.light,
        borderRadius: '5px',
        padding: '8px'
    },
    assetOwnerLink: {
        color: palette.primary.main,
        textDecoration: 'underline',
    },
    assetOwnerType: {
        color: palette.primary.main,
    },
    updateButton: sharedButtonProps
}));

export interface DetailComponentProps extends GetDetailsTabDataForObjectQueryResult {
    disabled: boolean;
    objectType: number;
    subtitle: string;
    originalSubtitle: string;
    onSubtitleUpdate: (e) => void;
    onUpdateDetail: (objectType: number, data: UpdateDataFields) => void;
    publishedState: string;
}

export type UpdateDataFields =
    | UnitDetailFieldsInput
    | ProjectDetailFieldsInput
    | SubjectDetailFieldsInput
    | ItemDetailFieldsInput
    | CaptureDataDetailFieldsInput
    | ModelDetailFieldsInput
    | SceneDetailFieldsInput
    | ProjectDocumentationDetailFieldsInput
    | AssetDetailFieldsInput
    | AssetVersionDetailFieldsInput
    | ActorDetailFieldsInput
    | StakeholderDetailFieldsInput;

type DetailsTabParams = {
    disabled: boolean;
    idSystemObject: number;
    objectType: eSystemObjectType;
    assetOwner: RepositoryPath | undefined | null;
    sourceObjects: StateRelatedObject[];
    derivedObjects: StateRelatedObject[];
    onAddSourceObject: () => void;
    onAddDerivedObject: () => void;
    onUpdateDetail: (objectType: number, data: UpdateDataFields) => void;
    onSubtitleUpdate: (e) => void;
    subtitle?: string;
    originalSubtitle?: string;
    objectVersions: SystemObjectVersion[];
    detailQuery: any;
    metadata: Metadata[];
    onUploaderOpen: (objectType: eIngestionMode, references: UploadReferences) => void;
    publishedState: string;
};

function DetailsTab(props: DetailsTabParams): React.ReactElement {
    const {
        disabled,
        idSystemObject,
        objectType,
        assetOwner,
        sourceObjects,
        derivedObjects,
        onAddSourceObject,
        onAddDerivedObject,
        onUpdateDetail,
        onSubtitleUpdate,
        subtitle,
        originalSubtitle,
        objectVersions,
        detailQuery,
        metadata,
        onUploaderOpen,
        publishedState
    } = props;
    const [tab, setTab] = useState(0);
    const classes = useStyles();

    const handleTabChange = (_, nextTab: number) => {
        setTab(nextTab);
    };

    const detailsQueryResult = detailQuery;
    let tabs: string[] = [];

    let tabPanels: React.ReactNode = null;
    const RelatedTab = (index: number) => (
        <TabPanel value={tab} index={index} id={`tab-${index}`}>
            <Box>
                {assetOwner &&
                (
                    <Box className={classes.assetOwner}>
                        <Typography>Asset Owner:</Typography>
                        &nbsp;
                        <Typography className={classes.assetOwnerType}>{getTermForSystemObjectType(assetOwner.objectType)}</Typography>
                        &nbsp;
                        <NewTabLink to={getDetailsUrlForObject(assetOwner.idSystemObject)}>
                            <Typography className={classes.assetOwnerLink}>{assetOwner.name}</Typography>
                        </NewTabLink>
                    </Box>
                )}
                <RelatedObjectsList
                    disabled={disabled}
                    type={RelatedObjectType.Source}
                    relatedObjects={sourceObjects}
                    onAdd={onAddSourceObject}
                    currentObject={idSystemObject}
                    onRemoveConnection={deleteObjectConnection}
                    objectType={objectType}
                    relationshipLanguage='Parents'
                />
                <RelatedObjectsList
                    disabled={disabled}
                    type={RelatedObjectType.Derived}
                    relatedObjects={derivedObjects}
                    onAdd={onAddDerivedObject}
                    currentObject={idSystemObject}
                    onRemoveConnection={deleteObjectConnection}
                    objectType={objectType}
                    relationshipLanguage='Children'
                />
            </Box>
        </TabPanel>
    );

    const ObjectVersionTableTab = (index: number, systemObjectType?: eSystemObjectType) => (
        <TabPanel value={tab} index={index} id={`tab-${index}`}>
            <ObjectVersionTable idSystemObject={idSystemObject} objectVersions={objectVersions} systemObjectType={systemObjectType} onUploaderOpen={onUploaderOpen} />
        </TabPanel>
    );

    const AssetDetailsTableTab = (index: number, idSystemObject: number, systemObjectType?: eSystemObjectType) => (
        <TabPanel value={tab} index={index} id={`tab-${index}`}>
            <AssetGrid idSystemObject={idSystemObject} systemObjectType={systemObjectType} onUploaderOpen={onUploaderOpen} />
        </TabPanel>
    );

    const MetadataTab = (index: number, type: eObjectMetadataType, metadata: Metadata[]) => (
        <TabPanel value={tab} index={index} id={`tab-${index}`}>
            <Box mb={3}>
                <MetadataDisplayTable />
            </Box>
            <Box>
                <MetadataControlTable type={type} metadataData={metadata} />
            </Box>
        </TabPanel>
    );

    const sharedProps = {
        onUpdateDetail,
        objectType,
        disabled,
        onSubtitleUpdate,
        subtitle,
        originalSubtitle
    };

    const detailsProps = {
        ...detailsQueryResult,
        ...sharedProps,
        publishedState
    };

    let onAddVersion = () => {};
    if (detailsQueryResult.data?.getDetailsTabDataForObject.Asset?.idAsset) {
        onAddVersion = () => onUploaderOpen(eIngestionMode.eUpdate, { idAsset: detailsQueryResult.data?.getDetailsTabDataForObject.Asset?.idAsset });
    }
    switch (objectType) {
        case eSystemObjectType.eUnit:
            tabs = ['Details', 'Related', 'Metadata'];
            tabPanels = (
                <React.Fragment>
                    <TabPanel value={tab} index={0} id='tab-0'>
                        <UnitDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(1)}
                    {MetadataTab(2, eObjectMetadataType.eDetailView, metadata)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eProject:
            tabs = ['Details', 'Related', 'Metadata'];
            tabPanels = (
                <React.Fragment>
                    <TabPanel value={tab} index={0} id='tab-0'>
                        <ProjectDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(1)}
                    {MetadataTab(2, eObjectMetadataType.eDetailView, metadata)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eSubject:
            tabs = ['Details', 'Related', 'Metadata'];
            tabPanels = (
                <React.Fragment>
                    <TabPanel value={tab} index={0} id='tab-0'>
                        <SubjectDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(1)}
                    {MetadataTab(2, eObjectMetadataType.eSubjectView, metadata)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eItem:
            tabs = ['Details', 'Related', 'Metadata'];
            tabPanels = (
                <React.Fragment>
                    <TabPanel value={tab} index={0} id='tab-0'>
                        <ItemDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(1)}
                    {MetadataTab(2, eObjectMetadataType.eDetailView, metadata)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eCaptureData:
            tabs = ['Assets', 'Details', 'Related', 'Versions', 'Metadata'];
            tabPanels = (
                <React.Fragment>
                    {AssetDetailsTableTab(0, idSystemObject, eSystemObjectType.eCaptureData)}
                    <TabPanel value={tab} index={1} id='tab-0'>
                        <CaptureDataDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(2)}
                    {ObjectVersionTableTab(3, eSystemObjectType.eCaptureData)}
                    {MetadataTab(4, eObjectMetadataType.eDetailView, metadata)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eModel:
            tabs = ['Assets', 'Details', 'Related', 'Versions', 'Metadata'];
            tabPanels = (
                <React.Fragment>
                    {AssetDetailsTableTab(0, idSystemObject, eSystemObjectType.eModel)}
                    <TabPanel value={tab} index={1} id='tab-1'>
                        <ModelDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(2)}
                    {ObjectVersionTableTab(3, eSystemObjectType.eModel)}
                    {MetadataTab(4, eObjectMetadataType.eDetailView, metadata)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eScene:
            tabs = ['Assets', 'Details', 'Related', 'Versions', 'Metadata'];
            tabPanels = (
                <React.Fragment>
                    {AssetDetailsTableTab(0, idSystemObject, eSystemObjectType.eScene)}
                    <TabPanel value={tab} index={1} id='tab-1'>
                        <SceneDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(2)}
                    {ObjectVersionTableTab(3, eSystemObjectType.eScene)}
                    {MetadataTab(4, eObjectMetadataType.eDetailView, metadata)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eIntermediaryFile:
            tabs = ['Assets', 'Details', 'Related', 'Versions', 'Metadata'];
            tabPanels = (
                <React.Fragment>
                    {AssetDetailsTableTab(0, idSystemObject, eSystemObjectType.eIntermediaryFile)}
                    <TabPanel value={tab} index={1} id='tab-1'>
                        <IntermediaryFileDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(2)}
                    {ObjectVersionTableTab(3, eSystemObjectType.eIntermediaryFile)}
                    {MetadataTab(4, eObjectMetadataType.eDetailView, metadata)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eProjectDocumentation:
            tabs = ['Assets', 'Details', 'Related', 'Versions', 'Metadata'];
            tabPanels = (
                <React.Fragment>
                    {AssetDetailsTableTab(0, idSystemObject, eSystemObjectType.eProjectDocumentation)}
                    <TabPanel value={tab} index={1} id='tab-1'>
                        <ProjectDocumentationDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(2)}
                    {ObjectVersionTableTab(3, eSystemObjectType.eProjectDocumentation)}
                    {MetadataTab(4, eObjectMetadataType.eDetailView, metadata)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eAsset:
            tabs = ['Versions', 'Details', 'Related', 'Metadata'];
            tabPanels = (
                <React.Fragment>
                    <TabPanel value={tab} index={0} id='tab-0'>
                        <AssetVersionsTable idSystemObject={idSystemObject} />
                        <Button className={classes.updateButton} variant='contained' disableElevation color='primary' style={{ width: 'fit-content' }} onClick={onAddVersion}>
                            Add Version
                        </Button>
                    </TabPanel>
                    <TabPanel value={tab} index={1}>
                        <AssetDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(2)}
                    {MetadataTab(3, eObjectMetadataType.eDetailView, metadata)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eAssetVersion:
            tabs = ['Details', 'Related', 'Metadata'];
            tabPanels = (
                <React.Fragment>
                    <TabPanel value={tab} index={0} id='tab-0'>
                        <AssetVersionDetails {...detailsProps} onUploaderOpen={onUploaderOpen} />
                    </TabPanel>
                    {RelatedTab(1)}
                    {MetadataTab(2, eObjectMetadataType.eDetailView, metadata)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eActor:
            tabs = ['Details', 'Related', 'Metadata'];
            tabPanels = (
                <React.Fragment>
                    <TabPanel value={tab} index={0} id='tab-0'>
                        <ActorDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(1)}
                    {MetadataTab(2, eObjectMetadataType.eDetailView, metadata)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eStakeholder:
            tabs = ['Details', 'Related', 'Metadata'];
            tabPanels = (
                <React.Fragment>
                    <TabPanel value={tab} index={0} id='tab-0'>
                        <StakeholderDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(1)}
                    {MetadataTab(2, eObjectMetadataType.eDetailView, metadata)}
                </React.Fragment>
            );
            break;
        default:
            tabs = ['Unknown'];
            break;
    }

    return (
        <Box display='flex' flex={1} flexDirection='column' mt={2} style={{ width: '41rem' }}>
            <Tabs value={tab} classes={{ root: classes.tab }} indicatorColor='primary' textColor='primary' onChange={handleTabChange} aria-label='detailsTab'>
                {tabs.map((tab: string, index: number) => (
                    <StyledTab key={index} label={tab} aria-label={tab} />
                ))}
            </Tabs>
            {tabPanels}
        </Box>
    );
}

function TabPanel(props: any): React.ReactElement {
    const { children, value, index, ...rest } = props;
    const classes = useStyles();

    return (
        <div role='tabpanel' hidden={value !== index} aria-label='repository detail tabs' aria-labelledby={`tab-${index}`} {...rest}>
            {value === index && (
                <Box p={1} className={classes.tabpanel} minHeight='fit-content' minWidth='50vw' width='auto'>
                    {children}
                </Box>
            )}
        </div>
    );
}

const StyledTab = withStyles(({ palette }) => ({
    root: {
        color: palette.background.paper,
        '&:focus': {
            opacity: 1
        }
    }
}))((props: TabProps) => <Tab disableRipple {...props} />);

export default DetailsTab;
