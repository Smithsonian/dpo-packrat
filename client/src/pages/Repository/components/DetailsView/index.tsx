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
import { /*parseIdentifiersToState,*/ useVocabularyStore, useRepositoryStore, useIdentifierStore, useDetailTabStore, ModelDetailsType, SceneDetailsType } from '../../../../store';
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
    SceneDetailFieldsInput,
    StakeholderDetailFieldsInput,
    SubjectDetailFieldsInput,
    UnitDetailFieldsInput,
    UpdateIdentifier,
    UpdateObjectDetailsDataInput
} from '../../../../types/graphql';
import { eSystemObjectType, eVocabularySetID } from '../../../../types/server';
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
        flexDirection: 'column',
        // maxHeight: 'calc(100vh - 140px)',
        padding: 20,
        marginBottom: 20,
        borderRadius: 10,
        overflowY: 'scroll',
        backgroundColor: palette.primary.light,
        [breakpoints.down('lg')]: {
            // maxHeight: 'calc(100vh - 120px)',
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
};

function DetailsView(): React.ReactElement {
    const classes = useStyles();
    const params = useParams<DetailsParams>();
    const [modalOpen, setModalOpen] = useState(false);
    const [details, setDetails] = useState<DetailsFields>({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [detailQuery, setDetailQuery] = useState<any>({});
    const [isUpdatingData, setIsUpdatingData] = useState(false);
    const [objectRelationship, setObjectRelationship] = useState('');
    const [loadingIdentifiers, setLoadingIdentifiers] = useState(true);
    const idSystemObject: number = Number.parseInt(params.idSystemObject, 10);
    const { data, loading } = useObjectDetails(idSystemObject);
    let [updatedData, setUpdatedData] = useState<UpdateObjectDetailsDataInput>({});
    const [updatedIdentifiers, setUpdatedIdentifiers] = useState(false);
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
    const objectDetailsData = data;

    useEffect(() => {
        if (data) {
            const fetchDetailTabDataAndInitializeStateStore = async () => {
                const detailsTabData = await getDetailsTabDataForObject(idSystemObject, objectType);
                setDetailQuery(detailsTabData);
                initializeDetailFields(detailsTabData, objectType);
                if (objectType === eSystemObjectType.eSubject) {
                    initializePreferredIdentifier(detailsTabData?.data?.getDetailsTabDataForObject?.Subject?.idIdentifierPreferred);
                    setLoadingIdentifiers(false);
                }
            };

            fetchDetailTabDataAndInitializeStateStore();
        }
    }, [idSystemObject, data]);

    useEffect(() => {
        if (data && !loading) {
            const { name, retired, license } = data.getSystemObjectDetails;
            setDetails({ name, retired, idLicense: license?.idLicense || 0 });
            initializeIdentifierState(data.getSystemObjectDetails.identifiers);
        }
    }, [data, loading, initializeIdentifierState]);

    // checks for updates to identifiers
    useEffect(() => {
        setUpdatedIdentifiers(areIdentifiersUpdated());
    }, [stateIdentifiers]);

    if (!data || !params.idSystemObject) {
        return <ObjectNotFoundView loading={loading} />;
    }

    const {
        idObject,
        objectType,
        allowed,
        publishedState,
        thumbnail,
        unit,
        project,
        subject,
        item,
        objectAncestors,
        sourceObjects,
        derivedObjects,
        objectVersions,
        licenseInherited = null
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
        setObjectRelationship('');
        resetRepositoryFilter();
    };

    const onAddSourceObject = () => {
        setObjectRelationship('Source');
        resetKeywordSearch();
        resetRepositoryFilter();
        initializeTree();
        setModalOpen(true);
    };

    const onAddDerivedObject = () => {
        setObjectRelationship('Derived');
        resetKeywordSearch();
        resetRepositoryFilter();
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

    const updateData = async (): Promise<void> => {
        toast.dismiss();
        setIsUpdatingData(true);
        const identifierCheck = checkIdentifiersBeforeUpdate();
        if (identifierCheck.length) {
            identifierCheck.forEach(error => toast.error(error));
            setIsUpdatingData(false);
            return;
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
        updatedData.Identifiers = stateIdentifiersWithIdSystemObject || [];

        // Create another validation here to make sure that the appropriate SO types are being checked
        const errors = await getDetailsViewFieldErrors(updatedData, objectType);
        if (errors.length) {
            errors.forEach(error => toast.error(`${error}`, { autoClose: false }));
            setIsUpdatingData(false);
            return;
        }

        try {
            // TODO: Model, Scene, and CD are currently updating in a way that
            // requires the fields to be populated.
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
                    DateCaptured: DateCreated
                };
            }

            if (objectType === eSystemObjectType.eScene && updatedData.Scene) {
                const SceneDetails = getDetail(objectType) as SceneDetailsType;
                const { HasBeenQCd, IsOriented } = SceneDetails;
                updatedData.Scene = { IsOriented, HasBeenQCd };
            }
            // convert subject and item inputs to numbers to handle scientific notation
            if (objectType === eSystemObjectType.eSubject && updatedData.Subject) {
                const { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = updatedData.Subject;
                if (Latitude) updatedData.Subject.Latitude = Number(Latitude);
                if (Longitude) updatedData.Subject.Longitude = Number(Longitude);
                if (Altitude) updatedData.Subject.Altitude = Number(Altitude);
                if (TS0) updatedData.Subject.TS0 = Number(TS0);
                if (TS1) updatedData.Subject.TS1 = Number(TS1);
                if (TS2) updatedData.Subject.TS2 = Number(TS2);
                if (R0) updatedData.Subject.R0 = Number(R0);
                if (R1) updatedData.Subject.R1 = Number(R1);
                if (R2) updatedData.Subject.R2 = Number(R2);
                if (R3) updatedData.Subject.R3 = Number(R3);
            }

            if (objectType === eSystemObjectType.eItem && updatedData.Item) {
                const { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = updatedData.Item;
                if (Latitude) updatedData.Item.Latitude = Number(Latitude);
                if (Longitude) updatedData.Item.Longitude = Number(Longitude);
                if (Altitude) updatedData.Item.Altitude = Number(Altitude);
                if (TS0) updatedData.Item.TS0 = Number(TS0);
                if (TS1) updatedData.Item.TS1 = Number(TS1);
                if (TS2) updatedData.Item.TS2 = Number(TS2);
                if (R0) updatedData.Item.R0 = Number(R0);
                if (R1) updatedData.Item.R1 = Number(R1);
                if (R2) updatedData.Item.R2 = Number(R2);
                if (R3) updatedData.Item.R3 = Number(R3);
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

            const { data } = await updateDetailsTabData(idSystemObject, idObject, objectType, updatedData);
            if (data?.updateObjectDetails?.success) {
                toast.success('Data saved successfully');
            } else {
                throw new Error(data?.updateObjectDetails?.message);
            }
        } catch (error) {
            toast.error(error.toString() || 'Failed to save updated data');
        } finally {
            setIsUpdatingData(false);
        }
    };

    return (
        <Box className={classes.container}>
            <DetailsHeader
                originalFields={data.getSystemObjectDetails}
                name={details.name}
                disabled={disabled}
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
                    onRetiredUpdate={onRetiredUpdate}
                    onLicenseUpdate={onLicenseUpdate}
                    publishedState={publishedState}
                    originalFields={data.getSystemObjectDetails}
                    retired={withDefaultValueBoolean(details.retired, false)}
                    license={withDefaultValueNumber(details.idLicense, 0)}
                    disabled={disabled}
                    idSystemObject={idSystemObject}
                    licenseInherited={licenseInherited}
                    path={objectAncestors}
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
                {updatedIdentifiers && <div style={{ fontStyle: 'italic', marginLeft: '5px' }}>Update needed to save your identifier data entry</div>}
            </Box>

            <Box display='flex'>
                <DetailsTab
                    disabled={disabled}
                    idSystemObject={idSystemObject}
                    objectType={objectType}
                    sourceObjects={sourceObjects}
                    derivedObjects={derivedObjects}
                    onAddSourceObject={onAddSourceObject}
                    onAddDerivedObject={onAddDerivedObject}
                    onUpdateDetail={onUpdateDetail}
                    objectVersions={objectVersions}
                    detailQuery={detailQuery}
                />
                <Box display='flex' flex={1} padding={2}>
                    <DetailsThumbnail thumbnail={thumbnail} idSystemObject={idSystemObject} objectType={objectType} />
                </Box>
            </Box>

            <ObjectSelectModal
                open={modalOpen}
                onModalClose={onModalClose}
                selectedObjects={objectRelationship === 'Source' ? sourceObjects : derivedObjects}
                idSystemObject={idSystemObject}
                relationship={objectRelationship}
            />
        </Box>
    );
}

export default DetailsView;
