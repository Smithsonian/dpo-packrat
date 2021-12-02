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
import { StateRelatedObject } from '../../../../../store';
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
    RepositoryPath
} from '../../../../../types/graphql';
import { eSystemObjectType } from '../../../../../types/server';
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
import { useHistory } from 'react-router-dom';
import { updateSystemObjectUploadRedirect } from '../../../../../constants';
import AssetGrid from './AssetGrid';

const useStyles = makeStyles(({ palette }) => ({
    tab: {
        backgroundColor: fade(palette.primary.main, 0.25)
    },
    tabpanel: {
        backgroundColor: fade(palette.primary.main, 0.25)
    },
    assetOwner: {
        display: 'flex',
        width: '100%',
        marginBottom: 12
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
    onUpdateDetail: (objectType: number, data: UpdateDataFields) => void;
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
    objectVersions: SystemObjectVersion[];
    detailQuery: any;
};

function DetailsTab(props: DetailsTabParams): React.ReactElement {
    const { disabled, idSystemObject, objectType, assetOwner, sourceObjects, derivedObjects, onAddSourceObject, onAddDerivedObject, onUpdateDetail, objectVersions, detailQuery } = props;
    const [tab, setTab] = useState(0);
    const classes = useStyles();
    const history = useHistory();

    const handleTabChange = (_, nextTab: number) => {
        setTab(nextTab);
    };

    const detailsQueryResult = detailQuery;
    let tabs: string[] = [];

    let tabPanels: React.ReactNode = null;
    const RelatedTab = (index: number) => (
        <TabPanel value={tab} index={index}>
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
                    relationshipLanguage='Parent(s)'
                />
                <RelatedObjectsList
                    disabled={disabled}
                    type={RelatedObjectType.Derived}
                    relatedObjects={derivedObjects}
                    onAdd={onAddDerivedObject}
                    currentObject={idSystemObject}
                    onRemoveConnection={deleteObjectConnection}
                    objectType={objectType}
                    relationshipLanguage='Child(ren)'
                />
            </Box>
        </TabPanel>
    );

    const ObjectVersionTableTab = (index: number, systemObjectType?: eSystemObjectType) => (
        <TabPanel value={tab} index={index}>
            <ObjectVersionTable idSystemObject={idSystemObject} objectVersions={objectVersions} systemObjectType={systemObjectType} />
        </TabPanel>
    );

    const AssetDetailsTableTab = (index: number, idSystemObject: number, systemObjectType?: eSystemObjectType) => (
        <TabPanel value={tab} index={index}>
            <AssetGrid idSystemObject={idSystemObject} systemObjectType={systemObjectType} />
        </TabPanel>
    );

    const sharedProps = {
        onUpdateDetail,
        objectType,
        disabled
    };

    const detailsProps = {
        ...detailsQueryResult,
        ...sharedProps
    };

    let redirect = () => {};
    if (detailsQueryResult.data?.getDetailsTabDataForObject.Asset?.idAsset) {
        redirect = () => {
            const newEndpoint = updateSystemObjectUploadRedirect(
                detailsQueryResult.data?.getDetailsTabDataForObject.Asset?.idAsset,
                null,
                eSystemObjectType.eAsset,
                detailsQueryResult.data?.getDetailsTabDataForObject.Asset?.AssetType
            );
            history.push(newEndpoint);
        };
    }

    switch (objectType) {
        case eSystemObjectType.eUnit:
            tabs = ['Details', 'Related'];
            tabPanels = (
                <React.Fragment>
                    <TabPanel value={tab} index={0}>
                        <UnitDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(1)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eProject:
            tabs = ['Details', 'Related'];
            tabPanels = (
                <React.Fragment>
                    <TabPanel value={tab} index={0}>
                        <ProjectDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(1)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eSubject:
            tabs = ['Details', 'Related'];
            tabPanels = (
                <React.Fragment>
                    <TabPanel value={tab} index={0}>
                        <SubjectDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(1)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eItem:
            tabs = ['Details', 'Related'];
            tabPanels = (
                <React.Fragment>
                    <TabPanel value={tab} index={0}>
                        <ItemDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(1)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eCaptureData:
            tabs = ['Assets', 'Details', 'Related', 'Versions'];
            tabPanels = (
                <React.Fragment>
                    {AssetDetailsTableTab(0, idSystemObject, eSystemObjectType.eCaptureData)}
                    <TabPanel value={tab} index={1}>
                        <CaptureDataDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(2)}
                    {ObjectVersionTableTab(3, eSystemObjectType.eCaptureData)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eModel:
            tabs = ['Assets', 'Details', 'Related', 'Versions'];
            tabPanels = (
                <React.Fragment>
                    {AssetDetailsTableTab(0, idSystemObject, eSystemObjectType.eModel)}
                    <TabPanel value={tab} index={1}>
                        <ModelDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(2)}
                    {ObjectVersionTableTab(3, eSystemObjectType.eModel)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eScene:
            tabs = ['Assets', 'Details', 'Related', 'Versions'];
            tabPanels = (
                <React.Fragment>
                    {AssetDetailsTableTab(0, idSystemObject, eSystemObjectType.eScene)}
                    <TabPanel value={tab} index={1}>
                        <SceneDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(2)}
                    {ObjectVersionTableTab(3, eSystemObjectType.eScene)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eIntermediaryFile:
            tabs = ['Assets', 'Details', 'Related', 'Versions'];
            tabPanels = (
                <React.Fragment>
                    {AssetDetailsTableTab(0, idSystemObject, eSystemObjectType.eIntermediaryFile)}
                    <TabPanel value={tab} index={1}>
                        <IntermediaryFileDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(2)}
                    {ObjectVersionTableTab(3, eSystemObjectType.eIntermediaryFile)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eProjectDocumentation:
            tabs = ['Assets', 'Details', 'Related', 'Versions'];
            tabPanels = (
                <React.Fragment>
                    {AssetDetailsTableTab(0, idSystemObject, eSystemObjectType.eProjectDocumentation)}
                    <TabPanel value={tab} index={1}>
                        <ProjectDocumentationDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(2)}
                    {ObjectVersionTableTab(3, eSystemObjectType.eProjectDocumentation)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eAsset:
            tabs = ['Versions', 'Details', 'Related'];
            tabPanels = (
                <React.Fragment>
                    <TabPanel value={tab} index={0}>
                        <AssetVersionsTable idSystemObject={idSystemObject} />
                        <Button className={classes.updateButton} variant='contained' color='primary' style={{ width: 'fit-content' }} onClick={redirect}>
                            Add Version
                        </Button>
                    </TabPanel>
                    <TabPanel value={tab} index={1}>
                        <AssetDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(2)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eAssetVersion:
            tabs = ['Details', 'Related'];
            tabPanels = (
                <React.Fragment>
                    <TabPanel value={tab} index={0}>
                        <AssetVersionDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(1)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eActor:
            tabs = ['Details', 'Related'];
            tabPanels = (
                <React.Fragment>
                    <TabPanel value={tab} index={0}>
                        <ActorDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(1)}
                </React.Fragment>
            );
            break;
        case eSystemObjectType.eStakeholder:
            tabs = ['Details', 'Related'];
            tabPanels = (
                <React.Fragment>
                    <TabPanel value={tab} index={0}>
                        <StakeholderDetails {...detailsProps} />
                    </TabPanel>
                    {RelatedTab(1)}
                </React.Fragment>
            );
            break;
        default:
            tabs = ['Unknown'];
            break;
    }

    return (
        <Box display='flex' flex={1} flexDirection='column' mt={2}>
            <Tabs value={tab} classes={{ root: classes.tab }} indicatorColor='primary' textColor='primary' onChange={handleTabChange}>
                {tabs.map((tab: string, index: number) => (
                    <StyledTab key={index} label={tab} />
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
        <div role='tabpanel' hidden={value !== index} aria-labelledby={`tab-${index}`} {...rest}>
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
