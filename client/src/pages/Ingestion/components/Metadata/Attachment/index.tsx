/**
 * Metadata - Attachment
 *
 * This component renders the metadata fields specific to attachment asset.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect } from 'react';
import { AssetIdentifiers } from '../../../../../components';
import { StateIdentifier, useMetadataStore, MetadataType } from '../../../../../store';
import AttachmentMetadataForm, { metadataRow } from './AttachmentMetadataForm';
import { eVocabularySetID } from '../../../../../types/server';

const useStyles = makeStyles(() => ({
    container: {
        marginTop: 20
    }
}));

interface AttachmentProps {
    readonly metadataIndex: number;
}

function Attachment(props: AttachmentProps): React.ReactElement {
    const { metadataIndex } = props;
    const classes = useStyles();
    const [updateMetadataField] = useMetadataStore(state => [state.updateMetadataField]);
    const metadata = useMetadataStore(state => state.metadatas[metadataIndex]);

    const urlParams = new URLSearchParams(window.location.search);
    const idAssetVersion = urlParams.get('fileId');

    useEffect(() => {
        updateMetadataField(metadataIndex, 'idAssetVersion', Number(idAssetVersion), MetadataType.sceneAttachment);
    }, [idAssetVersion, metadataIndex, updateMetadataField]);

    const onAttachmentIdentifierChange = (identifiers: StateIdentifier[]): void => {
        updateMetadataField(metadataIndex, 'identifiers', identifiers, MetadataType.sceneAttachment);
    };

    const setAttachmentCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateMetadataField(metadataIndex, name, checked, MetadataType.sceneAttachment);
    };

    const setAttachmentNameField = ({ target }): void => {
        const { name, value } = target;
        updateMetadataField(metadataIndex, name, value, MetadataType.sceneAttachment);
    };

    const attachmentArr: metadataRow[] = [
        { name: 'type', label: 'Type', type: 'index', index: eVocabularySetID.eEdan3DResourceType },
        { name: 'category', label: 'Category', type: 'index', index: eVocabularySetID.eEdan3DResourceCategory },
        { name: 'units', label: 'Units', type: 'index', index: eVocabularySetID.eEdan3DResourceAttributeUnits },
        { name: 'modelType', label: 'Model Type', type: 'index', index: eVocabularySetID.eEdan3DResourceAttributeModelFileType },
        { name: 'fileType', label: 'File Type', type: 'index', index: eVocabularySetID.eEdan3DResourceAttributeFileType },
        { name: 'gltfStandardized', label: 'glTF Standardized', type: 'boolean' },
        { name: 'dracoCompressed', label: 'Draco Compressed', type: 'boolean' },
        { name: 'title', label: 'Title', type: 'string' }
    ];

    const {
        type,
        category,
        units,
        modelType,
        fileType,
        gltfStandardized,
        dracoCompressed,
        title,
        systemCreated,
        identifiers
    } = metadata.sceneAttachment;

    const attachmentMetadata = {
        type,
        category,
        units,
        modelType,
        fileType,
        gltfStandardized,
        dracoCompressed,
        title
    };

    const content = (
        <React.Fragment>
            <Box width='52vw'>
                <AssetIdentifiers
                    systemCreated={systemCreated}
                    identifiers={identifiers}
                    onSystemCreatedChange={setAttachmentCheckboxField}
                    onAddIdentifer={onAttachmentIdentifierChange}
                    onUpdateIdentifer={onAttachmentIdentifierChange}
                    onRemoveIdentifer={onAttachmentIdentifierChange}
                />
            </Box>

            <AttachmentMetadataForm
                metadatas={attachmentArr}
                metadataState={attachmentMetadata}
                setNameField={setAttachmentNameField}
                setCheckboxField={setAttachmentCheckboxField}
            />
        </React.Fragment>
    );


    return (
        <Box className={classes.container}>
            {content}
        </Box>
    );
}

export default Attachment;