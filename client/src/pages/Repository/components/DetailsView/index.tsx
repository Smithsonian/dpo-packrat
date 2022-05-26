/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */

/**
 * DetailsView
 *
 * This component renders repository details view for the Repository UI.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'react-toastify';
import { LoadingButton } from '../../../../components';
import IdentifierList from '../../../../components/shared/IdentifierList';
import { useVocabularyStore, useRepositoryStore, useIdentifierStore, useDetailTabStore, ModelDetailsType, SceneDetailsType, useObjectMetadataStore, eObjectMetadataType } from '../../../../store';
import {
    ActorDetailFieldsInput,
    AssetDetailFieldsInput,
    AssetVersionDetailFieldsInput,
    CaptureDataDetailFields,
    CaptureDataDetailFieldsInput,
    ItemDetailFieldsInput,
    ModelDetailFieldsInput,
    ProjectDetailFieldsInput,
    ProjectDocumentationDetailFieldsInput,
    RelatedObjectType,
    SceneDetailFieldsInput,
    StakeholderDetailFieldsInput,
    SubjectDetailFieldsInput,
    UnitDetailFieldsInput,
    UpdateIdentifier,
    UpdateObjectDetailsDataInput
} from '../../../../types/graphql';
import { eSystemObjectType, eVocabularySetID } from '@dpo-packrat/common';
import { withDefaultValueBoolean, withDefaultValueNumber } from '../../../../utils/shared';
import ObjectSelectModal from '../../../Ingestion/components/Metadata/Model/ObjectSelectModal';
import { updateDetailsTabData, useObjectDetails, deleteIdentifier, getDetailsTabDataForObject } from '../../hooks/useDetailsView';
import DetailsHeader from './DetailsHeader';
import DetailsTab, { UpdateDataFields } from './DetailsTab';
import DetailsThumbnail from './DetailsThumbnail';
import ObjectDetails from './ObjectDetails';
import ObjectNotFoundView from './ObjectNotFoundView';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 1,
        width: 'fit-content',
        flexDirection: 'column',
        padding: 20,
        paddingBottom: 0,
        paddingRight: 0,
        [breakpoints.down('lg')]: {
            paddingRight: 20
        }
    },
    content: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: 20,
        marginBottom: 20,
        borderRadius: 10,
        overflowY: 'auto',
        backgroundColor: palette.primary.light,
        [breakpoints.down('lg')]: {
            padding: 10
        }
    },
    updateButton: {
        height: 35,
        width: 100,
        color: palette.background.paper,
        [breakpoints.down('lg')]: {
            height: 30
        }
    }
}));

type DetailsParams = {
    idSystemObject: string;
};

type DetailsFields = {
    name?: string;
    retired?: boolean;
    idLicense?: number;
    subtitle?: string;
};


function DetailsView(): React.ReactElement {
    const classes = useStyles();
    const params = useParams<DetailsParams>();
    const [modalOpen, setModalOpen] = useState(false);
    const [details, setDetails] = useState<DetailsFields>({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [detailQuery, setDetailQuery] = useState<any>({});
    const [isUpdatingData, setIsUpdatingData] = useState(false);
    const [objectRelationship, setObjectRelationship] = useState<RelatedObjectType>(RelatedObjectType.Source);
    const [loadingIdentifiers, setLoadingIdentifiers] = useState(true);
    const idSystemObject: number = Number.parseInt(params.idSystemObject, 10);
    const { data, loading } = useObjectDetails(idSystemObject);
    let [updatedData, setUpdatedData] = useState<UpdateObjectDetailsDataInput>({});
    const [updatedIdentifiers, setUpdatedIdentifiers] = useState(false);
    const [updatedMetadata, setUpdatedMetadata] = useState(false);
    const getEntries = useVocabularyStore(state => state.getEntries);
    const [
        stateIdentifiers,
        areIdentifiersUpdated,
        addNewIdentifier,
        initializeIdentifierState,
        removeTargetIdentifier,
        updateIdentifier,
        checkIdentifiersBeforeUpdate,
        updateIdentifierPreferred,
        initializePreferredIdentifier
    ] = useIdentifierStore(state => [
        state.stateIdentifiers,
        state.areIdentifiersUpdated,
        state.addNewIdentifier,
        state.initializeIdentifierState,
        state.removeTargetIdentifier,
        state.updateIdentifier,
        state.checkIdentifiersBeforeUpdate,
        state.updateIdentifierPreferred,
        state.initializePreferredIdentifier
    ]);
    const [resetRepositoryFilter, resetKeywordSearch, initializeTree] = useRepositoryStore(state => [state.resetRepositoryFilter, state.resetKeywordSearch, state.initializeTree]);
    const [initializeDetailFields, getDetail, getDetailsViewFieldErrors] = useDetailTabStore(state => [
        state.initializeDetailFields,
        state.getDetail,
        state.getDetailsViewFieldErrors
    ]);
    const [getAllMetadataEntries, areMetadataUpdated, metadataControl, metadataDisplay, validateMetadataFields, initializeMetadata, resetMetadata] = useObjectMetadataStore(state => [state.getAllMetadataEntries, state.areMetadataUpdated, state.metadataControl, state.metadataDisplay, state.validateMetadataFields, state.initializeMetadata, state.resetMetadata]);

    const objectDetailsData = data;
    const fetchDetailTabDataAndSetState = async () => {
        const detailsTabData = await getDetailsTabDataForObject(idSystemObject, objectType);
        setDetailQuery(detailsTabData);
        initializeDetailFields(detailsTabData, objectType);
        if (objectType === eSystemObjectType.eSubject) {
            initializePreferredIdentifier(detailsTabData?.data?.getDetailsTabDataForObject?.Subject?.idIdentifierPreferred);
            setLoadingIdentifiers(false);
        }
    };

    useEffect(() => {
        if (data) {
            const handleDetailTab = async () => {
                await fetchDetailTabDataAndSetState();
            }
            handleDetailTab();
        }
    }, [idSystemObject, data]);

    useEffect(() => {
        if (data && !loading) {
            const { name, retired, license, metadata, subTitle } = data.getSystemObjectDetails;
            setDetails({ name, retired, idLicense: license?.idLicense || 0, subtitle: subTitle ?? '' });
            initializeIdentifierState(data.getSystemObjectDetails.identifiers);
            if (objectType === eSystemObjectType.eSubject) {
                initializeMetadata(eObjectMetadataType.eSubjectView, metadata); // comment me out!
            } else {
                initializeMetadata(eObjectMetadataType.eDetailView, metadata); // comment me out!
            }
        }
    }, [data, loading, initializeIdentifierState]);

    // checks for updates to identifiers
    useEffect(() => {
        setUpdatedIdentifiers(areIdentifiersUpdated());
    }, [stateIdentifiers]);

    // checks for updates to metadata
    useEffect(() => {
        setUpdatedMetadata(areMetadataUpdated());
    }, [metadataControl, metadataDisplay]);

    useEffect(() => {
        return () => {
            resetMetadata();
        };
    }, []);

    if (!data || !params.idSystemObject) {
        return <ObjectNotFoundView loading={loading} />;
    }

    const {
        idObject,
        objectType,
        allowed,
        publishedState,
        publishedEnum,
        publishable,
        thumbnail,
        unit,
        project,
        subject,
        item,
        asset,
        assetOwner,
        objectAncestors,
        sourceObjects,
        derivedObjects,
        objectVersions,
        metadata,
        licenseInheritance = null
    } = data.getSystemObjectDetails;

    const disabled: boolean = !allowed;

    const addIdentifer = () => {
        addNewIdentifier();
    };

    const removeIdentifier = async (idIdentifier: number, id: number) => {
        // handles deleting exisiting identifiers and newly added ones
        if (idIdentifier) {
            const confirm = window.confirm('Are you sure you wish to remove this?');
            if (!confirm) return;
            const deleteIdentifierSuccess = await deleteIdentifier(idIdentifier);
            if (deleteIdentifierSuccess) {
                removeTargetIdentifier(idIdentifier);
                setUpdatedIdentifiers(false);
                toast.success('Identifier removed');
            } else {
                toast.error('Error when removing identifier');
            }
        } else {
            removeTargetIdentifier(0, id);
        }
    };

    const updateIdentifierFields = (id: number, name: string, value) => {
        updateIdentifier(id, name, value);
    };

    const onModalClose = () => {
        setModalOpen(false);
        setObjectRelationship(RelatedObjectType.Source);
        resetRepositoryFilter(false);
    };

    const onAddSourceObject = () => {
        setObjectRelationship(RelatedObjectType.Source);
        resetKeywordSearch();
        resetRepositoryFilter(false);
        initializeTree();
        setModalOpen(true);
    };

    const onAddDerivedObject = () => {
        setObjectRelationship(RelatedObjectType.Derived);
        resetKeywordSearch();
        resetRepositoryFilter(false);
        initializeTree();
        setModalOpen(true);
    };

    const onNameUpdate = ({ target }): void => {
        const updatedDataFields: UpdateObjectDetailsDataInput = { ...updatedData };
        setDetails(details => ({ ...details, name: target.value }));
        updatedDataFields.Name = target.value;
        setUpdatedData(updatedDataFields);
    };

    const onRetiredUpdate = ({ target }): void => {
        const updatedDataFields: UpdateObjectDetailsDataInput = { ...updatedData };
        setDetails(details => ({ ...details, retired: target.checked }));
        updatedDataFields.Retired = target.checked;
        setUpdatedData(updatedDataFields);
    };

    const onLicenseUpdate = ({ target }): void => {
        const updatedDataFields: UpdateObjectDetailsDataInput = { ...updatedData };
        setDetails(details => ({ ...details, idLicense: target.value }));
        updatedDataFields.License = target.value;
        setUpdatedData(updatedDataFields);
    };

    const onSubtitleUpdate = ({ target }): void => {
        const updatedDataFields: UpdateObjectDetailsDataInput = { ...updatedData };
        setDetails(details => ({ ...details, subtitle: target.value }));
        updatedDataFields.Subtitle = target.value;
        setUpdatedData(updatedDataFields);
    };

    const onUpdateDetail = (objectType: number, data: UpdateDataFields): void => {
        // console.log('onUpdateDetail', objectType, data);
        const updatedDataFields: UpdateObjectDetailsDataInput = {
            ...updatedData,
            Name: details.name,
            Retired: details.retired
        };

        switch (objectType) {
            case eSystemObjectType.eUnit:
                updatedDataFields.Unit = data as UnitDetailFieldsInput;
                break;
            case eSystemObjectType.eProject:
                updatedDataFields.Project = data as ProjectDetailFieldsInput;
                break;
            case eSystemObjectType.eSubject:
                updatedDataFields.Subject = data as SubjectDetailFieldsInput;
                break;
            case eSystemObjectType.eItem:
                updatedDataFields.Item = data as ItemDetailFieldsInput;
                break;
            case eSystemObjectType.eCaptureData:
                updatedDataFields.CaptureData = data as CaptureDataDetailFieldsInput;
                break;
            case eSystemObjectType.eModel:
                updatedDataFields.Model = data as ModelDetailFieldsInput;
                break;
            case eSystemObjectType.eScene:
                updatedDataFields.Scene = data as SceneDetailFieldsInput;
                break;
            case eSystemObjectType.eIntermediaryFile:
                break;
            case eSystemObjectType.eProjectDocumentation:
                updatedDataFields.ProjectDocumentation = data as ProjectDocumentationDetailFieldsInput;
                break;
            case eSystemObjectType.eAsset:
                updatedDataFields.Asset = data as AssetDetailFieldsInput;
                break;
            case eSystemObjectType.eAssetVersion:
                updatedDataFields.AssetVersion = data as AssetVersionDetailFieldsInput;
                break;
            case eSystemObjectType.eActor:
                updatedDataFields.Actor = data as ActorDetailFieldsInput;
                break;
            case eSystemObjectType.eStakeholder:
                updatedDataFields.Stakeholder = data as StakeholderDetailFieldsInput;
                break;
            default:
                break;
        }

        setUpdatedData(updatedDataFields);
    };

    const updateData = async (): Promise<boolean> => {
        toast.dismiss();
        setIsUpdatingData(true);
        const identifierCheck = checkIdentifiersBeforeUpdate();
        if (identifierCheck.length) {
            identifierCheck.forEach(error => toast.error(error));
            setIsUpdatingData(false);
            return false;
        }

        const stateIdentifiersWithIdSystemObject: UpdateIdentifier[] = stateIdentifiers.map(({ id, identifier, identifierType, idIdentifier, preferred }) => {
            return {
                id,
                identifier,
                identifierType,
                idSystemObject,
                idIdentifier,
                preferred
            };
        });

        updatedData.Retired = updatedData?.Retired || details?.retired;
        updatedData.Name = updatedData?.Name || objectDetailsData?.getSystemObjectDetails.name;
        updatedData.Subtitle = updatedData?.Subtitle || details?.subtitle;
        updatedData.Identifiers = stateIdentifiersWithIdSystemObject || [];

        const invalidMetadata = validateMetadataFields();
        if (invalidMetadata.length) {
            invalidMetadata.forEach(message => toast.error(message, { autoClose: false }));
            return false;
        }

        if (objectType === eSystemObjectType.eItem && typeof updatedData.Item?.EntireSubject === 'boolean' && !updatedData.Item.EntireSubject) {
            if (!updatedData.Subtitle || !updatedData.Subtitle.length) {
                toast.error('Subtitle required because Entire Subject is not checked');
                setIsUpdatingData(false);
                return false;
            }
        }

        // Create another validation here to make sure that the appropriate SO types are being checked
        const errors = await getDetailsViewFieldErrors(updatedData, objectType);
        if (errors.length) {
            errors.forEach(error => toast.error(`${error}`, { autoClose: false }));
            setIsUpdatingData(false);
            return false;
        }

        try {
            if (objectType === eSystemObjectType.eModel) {
                const ModelDetails = getDetail(objectType) as ModelDetailsType;
                const { DateCreated, idVCreationMethod, idVModality, idVPurpose, idVUnits, idVFileType } = ModelDetails;

                updatedData.Model = {
                    Name: updatedData?.Name,
                    CreationMethod: idVCreationMethod,
                    Modality: idVModality,
                    Purpose: idVPurpose,
                    Units: idVUnits,
                    ModelFileType: idVFileType,
                    DateCreated
                };
            }

            if (objectType === eSystemObjectType.eScene && updatedData.Scene) {
                const SceneDetails = getDetail(objectType) as SceneDetailsType;
                const { ApprovedForPublication, PosedAndQCd } = SceneDetails;
                updatedData.Scene = { PosedAndQCd, ApprovedForPublication };
            }
            // convert subject and item inputs to numbers to handle scientific notation
            if (objectType === eSystemObjectType.eSubject && updatedData.Subject) {
                const { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = updatedData.Subject;
                updatedData.Subject.Latitude = Latitude ? Number(Latitude) : null;
                updatedData.Subject.Longitude = Longitude ? Number(Longitude) : null;
                updatedData.Subject.Altitude = Altitude ? Number(Altitude) : null;
                updatedData.Subject.TS0 = TS0 ? Number(TS0) : null;
                updatedData.Subject.TS1 = TS1 ? Number(TS1) : null;
                updatedData.Subject.TS2 = TS2 ? Number(TS2) : null;
                updatedData.Subject.R0 = R0 ? Number(R0) : null;
                updatedData.Subject.R1 = R1 ? Number(R1) : null;
                updatedData.Subject.R2 = R2 ? Number(R2) : null;
                updatedData.Subject.R3 = R3 ? Number(R3) : null;
            }

            if (objectType === eSystemObjectType.eItem && updatedData.Item) {
                const { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = updatedData.Item;
                updatedData.Item.Latitude = Latitude ? Number(Latitude) : null;
                updatedData.Item.Longitude = Longitude ? Number(Longitude) : null;
                updatedData.Item.Altitude = Altitude ? Number(Altitude) : null;
                updatedData.Item.TS0 = TS0 ? Number(TS0) : null;
                updatedData.Item.TS1 = TS1 ? Number(TS1) : null;
                updatedData.Item.TS2 = TS2 ? Number(TS2) : null;
                updatedData.Item.R0 = R0 ? Number(R0) : null;
                updatedData.Item.R1 = R1 ? Number(R1) : null;
                updatedData.Item.R2 = R2 ? Number(R2) : null;
                updatedData.Item.R3 = R3 ? Number(R3) : null;
            }

            if (objectType === eSystemObjectType.eCaptureData) {
                const CaptureDataDetails = getDetail(objectType) as CaptureDataDetailFields;
                const {
                    captureMethod,
                    dateCaptured,
                    datasetType,
                    systemCreated,
                    description,
                    cameraSettingUniform,
                    datasetFieldId,
                    itemPositionType,
                    itemPositionFieldId,
                    itemArrangementFieldId,
                    focusType,
                    lightsourceType,
                    backgroundRemovalMethod,
                    clusterType,
                    clusterGeometryFieldId,
                    folders
                } = CaptureDataDetails;

                updatedData.CaptureData = {
                    captureMethod,
                    dateCaptured,
                    datasetType,
                    systemCreated,
                    description,
                    cameraSettingUniform,
                    datasetFieldId,
                    itemPositionType,
                    itemPositionFieldId,
                    itemArrangementFieldId,
                    focusType,
                    lightsourceType,
                    backgroundRemovalMethod,
                    clusterType,
                    clusterGeometryFieldId,
                    folders
                };
            }

            const metadata = getAllMetadataEntries().filter(entry => entry.Name);
            updatedData.Metadata = metadata;
            const { data } = await updateDetailsTabData(idSystemObject, idObject, objectType, updatedData);
            if (data?.updateObjectDetails?.success) {
                const message: string | null | undefined = data?.updateObjectDetails?.message;
                toast.success(`Data saved successfully${message? ': ' + message : ''}`);
                fetchDetailTabDataAndSetState();
                return true;
            } else
                throw new Error(data?.updateObjectDetails?.message ?? '');
        } catch (error) {
            const message: string = (error instanceof Error) ? `: ${error.message}` : '';
            toast.error(`Failed to save updated data${message}`);
            return false;
        } finally {
            setIsUpdatingData(false);
        }
    };

    const immutableNameTypes = new Set([eSystemObjectType.eItem, eSystemObjectType.eModel, eSystemObjectType.eScene]);

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                <DetailsHeader
                    originalFields={data.getSystemObjectDetails}
                    name={details.name}
                    disabled={disabled || immutableNameTypes.has(objectType)}
                    objectType={objectType}
                    path={objectAncestors}
                    onNameUpdate={onNameUpdate}
                />

                <Box display='flex' mt={2}>
                    <ObjectDetails
                        unit={unit}
                        project={project}
                        subject={subject}
                        item={item}
                        asset={asset}
                        disabled={disabled}
                        publishedState={publishedState}
                        publishedEnum={publishedEnum}
                        publishable={publishable}
                        retired={withDefaultValueBoolean(details.retired, false)}
                        objectType={objectType}
                        onRetiredUpdate={onRetiredUpdate}
                        onLicenseUpdate={onLicenseUpdate}
                        originalFields={data.getSystemObjectDetails}
                        license={withDefaultValueNumber(details.idLicense, 0)}
                        idSystemObject={idSystemObject}
                        licenseInheritance={licenseInheritance}
                        path={objectAncestors}
                        updateData={updateData}
                    />
                    <Box display='flex' flex={2.2} flexDirection='column'>
                        <IdentifierList
                            viewMode
                            disabled={disabled}
                            identifiers={stateIdentifiers || []}
                            identifierTypes={getEntries(eVocabularySetID.eIdentifierIdentifierType)}
                            onAdd={addIdentifer}
                            onRemove={removeIdentifier}
                            onUpdate={updateIdentifierFields}
                            subjectView={objectType === eSystemObjectType.eSubject}
                            onUpdateIdIdentifierPreferred={updateIdentifierPreferred}
                            loading={loadingIdentifiers}
                        />
                    </Box>
                </Box>

                <Box display='flex' alignItems='center' mt={'10px'}>
                    <LoadingButton className={classes.updateButton} onClick={updateData} disableElevation loading={isUpdatingData}>
                        Update
                    </LoadingButton>
                    {(updatedIdentifiers || updatedMetadata) && <div style={{ fontStyle: 'italic', marginLeft: '5px' }}>Update needed to save your data</div>}
                    {objectType === eSystemObjectType.eScene && <LoadingButton className={classes.updateButton} loading={false} onClick={() => document.getElementById('Voyager-Explorer')?.scrollIntoView()} style={{ marginLeft: 5 }}>View</LoadingButton>}
                </Box>

                <Box display='flex'>
                    <DetailsTab
                        disabled={disabled}
                        idSystemObject={idSystemObject}
                        objectType={objectType}
                        assetOwner={assetOwner}
                        sourceObjects={sourceObjects}
                        derivedObjects={derivedObjects}
                        onAddSourceObject={onAddSourceObject}
                        onAddDerivedObject={onAddDerivedObject}
                        onUpdateDetail={onUpdateDetail}
                        onSubtitleUpdate={onSubtitleUpdate}
                        subtitle={details?.subtitle}
                        originalSubtitle={data.getSystemObjectDetails?.subTitle || ''}
                        objectVersions={objectVersions}
                        detailQuery={detailQuery}
                        metadata={metadata}
                    />
                </Box>

                <Box display='flex' flex={1} padding={2}>
                    <DetailsThumbnail thumbnail={thumbnail} idSystemObject={idSystemObject} objectType={objectType} />
                </Box>

                <ObjectSelectModal
                    open={modalOpen}
                    onModalClose={onModalClose}
                    selectedObjects={objectRelationship === RelatedObjectType.Source ? sourceObjects : derivedObjects}
                    idSystemObject={idSystemObject}
                    relationship={objectRelationship}
                    objectType={objectType}
                />
            </Box>
        </Box>
    );
}

export default DetailsView;
