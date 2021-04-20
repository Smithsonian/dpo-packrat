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
import { parseIdentifiersToState, useVocabularyStore, useRepositoryDetailsFormStore, useRepositoryStore } from '../../../../store';
import {
    ActorDetailFieldsInput,
    AssetDetailFieldsInput,
    AssetVersionDetailFieldsInput,
    CaptureDataDetailFieldsInput,
    ItemDetailFieldsInput,
    ModelDetailFieldsInput,
    ProjectDetailFieldsInput,
    ProjectDocumentationDetailFieldsInput,
    SceneDetailFieldsInput,
    StakeholderDetailFieldsInput,
    SubjectDetailFieldsInput,
    UnitDetailFieldsInput,
    UpdateObjectDetailsDataInput
} from '../../../../types/graphql';
import { eSystemObjectType, eVocabularySetID } from '../../../../types/server';
import { withDefaultValueBoolean } from '../../../../utils/shared';
import ObjectSelectModal from '../../../Ingestion/components/Metadata/Model/ObjectSelectModal';
import { updateDetailsTabData, useObjectDetails } from '../../hooks/useDetailsView';
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
        maxHeight: 'calc(100vh - 140px)',
        padding: 20,
        marginBottom: 20,
        borderRadius: 10,
        overflowY: 'scroll',
        backgroundColor: palette.primary.light,
        [breakpoints.down('lg')]: {
            maxHeight: 'calc(100vh - 120px)',
            padding: 10
        }
    },
    updateButton: {
        height: 35,
        width: 100,
        marginTop: 10,
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
};

function DetailsView(): React.ReactElement {
    const classes = useStyles();
    const params = useParams<DetailsParams>();
    const [modalOpen, setModalOpen] = useState(false);
    const [details, setDetails] = useState<DetailsFields>({});
    const [isUpdatingData, setIsUpdatingData] = useState(false);
    const [objectRelationship, setObjectRelationship] = useState('');

    const idSystemObject: number = Number.parseInt(params.idSystemObject, 10);
    const { data, loading } = useObjectDetails(idSystemObject);
    let [updatedData, setUpdatedData] = useState<UpdateObjectDetailsDataInput>({});

    const getEntries = useVocabularyStore(state => state.getEntries);
    const getFormState = useRepositoryDetailsFormStore(state => state.getFormState);
    const [resetRepositoryFilter, resetKeywordSearch, initializeTree] = useRepositoryStore(state => [state.resetRepositoryFilter, state.resetKeywordSearch, state.initializeTree]);
    const objectDetailsData = data;

    useEffect(() => {
        if (data && !loading) {
            const { name, retired } = data.getSystemObjectDetails;
            setDetails({ name, retired });
        }
    }, [data, loading]);

    if (!data || !params.idSystemObject) {
        return <ObjectNotFoundView loading={loading} />;
    }

    const {
        idObject,
        objectType,
        identifiers,
        allowed,
        publishedState,
        thumbnail,
        unit,
        project,
        subject,
        item,
        objectAncestors,
        sourceObjects,
        derivedObjects
    } = data.getSystemObjectDetails;
    console.log('identifiers', identifiers);
    const disabled: boolean = !allowed;

    const addIdentifer = () => {
        alert('TODO: KARAN: add identifier');
    };

    const removeIdentifier = () => {
        alert('TODO: KARAN: remove identifier');
    };

    const updateIdentifierFields = () => {
        alert('TODO: KARAN: update identifier');
    };

    const onSelectedObjects = () => {
        onModalClose();
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

    const onUpdateDetail = (objectType: number, data: UpdateDataFields): void => {
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
        setIsUpdatingData(true);
        try {
            if (objectType === eSystemObjectType.eModel) {
                const { dateCaptured, master, authoritative, creationMethod, modality, purpose, units, fileType } = getFormState();
                updatedData = {
                    Retired: updatedData?.Retired || details?.retired,
                    Name: updatedData?.Name || objectDetailsData?.getSystemObjectDetails.name,
                    Model: {
                        Name: updatedData?.Name,
                        Master: master,
                        Authoritative: authoritative,
                        CreationMethod: creationMethod,
                        Modality: modality,
                        Purpose: purpose,
                        Units: units,
                        ModelFileType: fileType,
                        DateCaptured: dateCaptured
                    }
                };
            }

            const { data } = await updateDetailsTabData(idSystemObject, idObject, objectType, updatedData);
            console.log('data', data);
            if (data?.updateObjectDetails?.success) {
                toast.success('Data saved successfully');
            } else {
                throw new Error('Update request returned success: false');
            }
        } catch (error) {
            toast.error('Failed to save updated data');
        } finally {
            setIsUpdatingData(false);
        }
    };

    const onRetiredUpdate = ({ target }): void => {
        const updatedDataFields: UpdateObjectDetailsDataInput = { ...updatedData };
        setDetails(details => ({ ...details, retired: target.checked }));
        updatedDataFields.Retired = target.checked;
        setUpdatedData(updatedDataFields);
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
                    publishedState={publishedState}
                    originalFields={data.getSystemObjectDetails}
                    retired={withDefaultValueBoolean(details.retired, false)}
                    disabled={disabled}
                />
                <Box display='flex' flex={3} flexDirection='column'>
                    <IdentifierList
                        viewMode
                        disabled={disabled}
                        identifiers={parseIdentifiersToState(identifiers, [])}
                        identifierTypes={getEntries(eVocabularySetID.eIdentifierIdentifierType)}
                        onAdd={addIdentifer}
                        onRemove={removeIdentifier}
                        onUpdate={updateIdentifierFields}
                    />
                </Box>
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
                />
                <Box display='flex' flex={1} padding={2}>
                    <DetailsThumbnail thumbnail={thumbnail} />
                </Box>
            </Box>

            <LoadingButton className={classes.updateButton} onClick={updateData} disableElevation loading={isUpdatingData}>
                Update
            </LoadingButton>

            <ObjectSelectModal
                open={modalOpen}
                onSelectedObjects={onSelectedObjects}
                onModalClose={onModalClose}
                selectedObjects={objectRelationship === 'Source' ? sourceObjects : derivedObjects}
                idSystemObject={idSystemObject}
                relationship={objectRelationship}
            />
        </Box>
    );
}

export default DetailsView;
