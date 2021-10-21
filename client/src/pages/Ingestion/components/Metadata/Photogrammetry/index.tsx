/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Metadata - Photogrammetry
 *
 * This component renders the metadata fields specific to photogrammetry asset.
 */
import { Box, Checkbox } from '@material-ui/core';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { AssetIdentifiers, DateInputField, FieldType, InputField, SelectField } from '../../../../../components';
import { MetadataType, StateIdentifier, StateMetadata, useMetadataStore, useVocabularyStore, useRepositoryStore, useSubjectStore, StateRelatedObject } from '../../../../../store';
import { eVocabularySetID, eSystemObjectType } from '../../../../../types/server';
import { withDefaultValueNumber } from '../../../../../utils/shared';
import AssetContents from './AssetContents';
import Description from './Description';
import RelatedObjectsList from '../Model/RelatedObjectsList';
import ObjectSelectModal from '../Model/ObjectSelectModal';
import { RelatedObjectType, useGetSubjectQuery } from '../../../../../types/graphql';

const useStyles = makeStyles(() => ({
    container: {
        marginTop: 20
    }
}));

interface PhotogrammetryProps {
    readonly metadataIndex: number;
}

function Photogrammetry(props: PhotogrammetryProps): React.ReactElement {
    const { metadataIndex } = props;
    const classes = useStyles();

    const [getFieldErrors, updateMetadataField] = useMetadataStore(state => [state.getFieldErrors, state.updateMetadataField]);
    const metadata: StateMetadata = useMetadataStore(state => state.metadatas[metadataIndex]);
    const [getEntries, getInitialEntry] = useVocabularyStore(state => [state.getEntries, state.getInitialEntry]);
    const [subjects] = useSubjectStore(state => [state.subjects]);
    const [setDefaultIngestionFilters, closeRepositoryBrowser] = useRepositoryStore(state => [state.setDefaultIngestionFilters, state.closeRepositoryBrowser]);
    const [modalOpen, setModalOpen] = useState(false);
    const [objectRelationship, setObjectRelationship] = useState<RelatedObjectType>(RelatedObjectType.Source);
    const { photogrammetry } = metadata;
    const errors = getFieldErrors(metadata);

    const subjectIdSystemObject = useGetSubjectQuery({
        variables: {
            input: {
                idSubject: subjects[0]?.id
            }
        }
    });

    const idSystemObject: number | undefined = subjectIdSystemObject?.data?.getSubject?.Subject?.SystemObject?.idSystemObject;
    const setField = ({ target }): void => {
        const { name, value } = target;
        updateMetadataField(metadataIndex, name, value, MetadataType.photogrammetry);
    };

    const setIdField = ({ target }): void => {
        const { name, value } = target;
        let idFieldValue: number | null = null;

        if (value) {
            idFieldValue = Number.parseInt(value, 10);
        }

        updateMetadataField(metadataIndex, name, idFieldValue, MetadataType.photogrammetry);
    };

    const setDateField = (name: string, value?: string | null): void => {
        if (value) {
            const date = new Date(value);
            updateMetadataField(metadataIndex, name, date, MetadataType.photogrammetry);
        }
    };

    const setNameField = ({ target }): void => {
        const { name, value } = target;
        if (value) updateMetadataField(metadataIndex, name, value, MetadataType.photogrammetry);
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateMetadataField(metadataIndex, name, checked, MetadataType.photogrammetry);
    };

    const onIdentifersChange = (identifiers: StateIdentifier[]): void => {
        updateMetadataField(metadataIndex, 'identifiers', identifiers, MetadataType.photogrammetry);
    };

    const updateFolderVariant = (folderId: number, variantType: number) => {
        const { folders } = photogrammetry;
        const updatedFolders = folders.map(folder => {
            if (folderId === folder.id) {
                return {
                    ...folder,
                    variantType
                };
            }
            return folder;
        });
        updateMetadataField(metadataIndex, 'folders', updatedFolders, MetadataType.photogrammetry);
    };

    const openSourceObjectModal = async () => {
        setDefaultIngestionFilters(eSystemObjectType.eModel, idSystemObject);
        await setObjectRelationship(RelatedObjectType.Source);
        await setModalOpen(true);
    };

    const openDerivedObjectModal = async () => {
        setDefaultIngestionFilters(eSystemObjectType.eModel, idSystemObject);
        await setObjectRelationship(RelatedObjectType.Derived);
        await setModalOpen(true);
    };

    const onRemoveSourceObject = (idSystemObject: number): void => {
        const { sourceObjects } = photogrammetry;
        const updatedSourceObjects = sourceObjects.filter(sourceObject => sourceObject.idSystemObject !== idSystemObject);
        updateMetadataField(metadataIndex, 'sourceObjects', updatedSourceObjects, MetadataType.photogrammetry);
    };

    const onRemoveDerivedObject = (idSystemObject: number): void => {
        const { derivedObjects } = photogrammetry;
        const updatedDerivedObjects = derivedObjects.filter(sourceObject => sourceObject.idSystemObject !== idSystemObject);
        updateMetadataField(metadataIndex, 'derivedObjects', updatedDerivedObjects, MetadataType.photogrammetry);
    };

    const onModalClose = () => {
        setModalOpen(false);
        setObjectRelationship(RelatedObjectType.Source);
        closeRepositoryBrowser();
    };

    const onSelectedObjects = (newSourceObjects: StateRelatedObject[]) => {
        updateMetadataField(metadataIndex, objectRelationship === RelatedObjectType.Source ? 'sourceObjects' : 'derivedObjects', newSourceObjects, MetadataType.photogrammetry);
        onModalClose();
    };
    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <Box className={classes.container}>
            <AssetIdentifiers
                systemCreated={photogrammetry.systemCreated}
                identifiers={photogrammetry.identifiers}
                onSystemCreatedChange={setCheckboxField}
                onAddIdentifer={onIdentifersChange}
                onUpdateIdentifer={onIdentifersChange}
                onRemoveIdentifer={onIdentifersChange}
            />
            <Box mb={2}>
                <RelatedObjectsList
                    type={RelatedObjectType.Source}
                    relatedObjects={photogrammetry.sourceObjects}
                    onAdd={openSourceObjectModal}
                    onRemove={onRemoveSourceObject}
                    relationshipLanguage='Parent(s)'
                />
            </Box>
            <Box mb={2}>
                <RelatedObjectsList
                    type={RelatedObjectType.Derived}
                    relatedObjects={photogrammetry.derivedObjects}
                    onAdd={openDerivedObjectModal}
                    onRemove={onRemoveDerivedObject}
                    relationshipLanguage='Child(ren)'
                />
            </Box>
            <Description value={photogrammetry.description} onChange={setField} />

            <Box display='flex' flexDirection='row' mt={1}>
                <Box display='flex' flex={1} flexDirection='column'>
                    <InputField required type='string' label='Name' name='name' value={photogrammetry.name} onChange={setNameField} />
                    <FieldType error={errors.photogrammetry.dateCaptured} required label='Date Captured' direction='row' containerProps={rowFieldProps}>
                        <DateInputField value={photogrammetry.dateCaptured} onChange={(_, value) => setDateField('dateCaptured', value)} />
                    </FieldType>

                    <SelectField
                        required
                        label='Dataset Type'
                        value={withDefaultValueNumber(photogrammetry.datasetType, getInitialEntry(eVocabularySetID.eCaptureDataDatasetType))}
                        name='datasetType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataDatasetType)}
                    />
                    <AssetContents
                        initialEntry={getInitialEntry(eVocabularySetID.eCaptureDataFileVariantType)}
                        folders={photogrammetry.folders}
                        options={getEntries(eVocabularySetID.eCaptureDataFileVariantType)}
                        onUpdate={updateFolderVariant}
                    />
                </Box>
                <Box display='flex' flex={1} flexDirection='column' ml='30px'>
                    <InputField label='Dataset Field ID' value={photogrammetry.datasetFieldId} name='datasetFieldId' onChange={setIdField} />
                    <SelectField
                        label='Item Position Type'
                        value={photogrammetry.itemPositionType}
                        name='itemPositionType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataItemPositionType)}
                    />
                    <InputField label='Item Position Field ID' value={photogrammetry.itemPositionFieldId} name='itemPositionFieldId' onChange={setIdField} />
                    <InputField label='Item Arrangement Field ID' value={photogrammetry.itemArrangementFieldId} name='itemArrangementFieldId' onChange={setIdField} />
                    <SelectField
                        label='Focus Type'
                        value={photogrammetry.focusType}
                        name='focusType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataFocusType)}
                    />

                    <SelectField
                        label='Light Source Type'
                        value={photogrammetry.lightsourceType}
                        name='lightsourceType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataLightSourceType)}
                    />

                    <SelectField
                        label='Background Removal Method'
                        value={photogrammetry.backgroundRemovalMethod}
                        name='backgroundRemovalMethod'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataBackgroundRemovalMethod)}
                    />

                    <SelectField
                        label='Cluster Type'
                        value={photogrammetry.clusterType}
                        name='clusterType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eCaptureDataClusterType)}
                    />

                    <InputField label='Cluster Geometry Field ID' value={photogrammetry.clusterGeometryFieldId} name='clusterGeometryFieldId' onChange={setIdField} />
                    <FieldType required={false} label='Camera Settings Uniform?' direction='row' containerProps={rowFieldProps}>
                        <CustomCheckbox disabled name='cameraSettingUniform' checked={photogrammetry.cameraSettingUniform} onChange={setCheckboxField} color='primary' />
                    </FieldType>
                </Box>
            </Box>
            <ObjectSelectModal
                open={modalOpen}
                onSelectedObjects={onSelectedObjects}
                onModalClose={onModalClose}
                selectedObjects={objectRelationship === RelatedObjectType.Source ? photogrammetry.sourceObjects : photogrammetry.derivedObjects}
                relationship={objectRelationship}
                objectType={eSystemObjectType.eCaptureData}
            />
        </Box>
    );
}

const checkboxStyles = ({ palette }) => ({
    root: {
        color: palette.primary.main,
        '&$checked': {
            color: palette.primary.main
        },
        '&$disabled': {
            color: palette.primary.main
        }
    },
    checked: {},
    disabled: {}
});

const CustomCheckbox = withStyles(checkboxStyles)(Checkbox);

export default Photogrammetry;
