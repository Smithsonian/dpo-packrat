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
import { parseIdentifiersToState, useVocabularyStore } from '../../../../store';
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

    const idSystemObject: number = Number.parseInt(params.idSystemObject, 10);
    const { data, loading } = useObjectDetails(idSystemObject);
    const [updatedData, setUpdatedData] = useState({});

    const getEntries = useVocabularyStore(state => state.getEntries);

    useEffect(() => {
        if (data && !loading) {
            const { name, retired } = data.getSystemObjectDetails;
            setDetails({ name, retired });
        }
    }, [data, loading]);

    if (!data || !params.idSystemObject) {
        return <ObjectNotFoundView loading={loading} />;
    }

    const { objectType, identifiers, allowed, publishedState, thumbnail, unit, project, subject, item, objectAncestors, sourceObjects, derivedObjects } = data.getSystemObjectDetails;

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
    };

    const onAddSourceObject = () => {
        setModalOpen(true);
    };

    const onAddDerivedObject = () => {
        setModalOpen(true);
    };

    const onNameUpdate = ({ target }): void => {
        const updatedDataFields: UpdateObjectDetailsDataInput = { ...updatedData };
        setDetails(details => ({ ...details, name: target.value }));
        updatedDataFields.Name = target.value;
        setUpdatedData(updatedDataFields);
    };

    const onUpdateDetail = (objectType: number, data: UpdateDataFields): void => {
        const updatedDataFields: UpdateObjectDetailsDataInput = { ...updatedData };

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
        const confirmed: boolean = global.confirm('Are you sure you want to update data');
        if (!confirmed) return;

        setIsUpdatingData(true);
        try {
            const { data } = await updateDetailsTabData(idSystemObject, objectType, updatedData);

            if (data?.updateObjectDetails?.success) {
                toast.success('Data saved successfully');
            }
        } catch (e) {
            console.log(JSON.stringify(e));
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

            <LoadingButton
                className={classes.updateButton}
                onClick={updateData}
                disableElevation
                loading={isUpdatingData}
            >
                Update
            </LoadingButton>

            <ObjectSelectModal
                open={modalOpen}
                onSelectedObjects={onSelectedObjects}
                onModalClose={onModalClose}
                selectedObjects={sourceObjects}
            />
        </Box>
    );
}

export default DetailsView;