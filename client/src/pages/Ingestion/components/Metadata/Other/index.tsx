/**
 * Metadata - Other
 *
 * This component renders the metadata fields for other asset types.
 */
import { Box } from '@material-ui/core';
import React, { useEffect } from 'react';
import { AssetIdentifiers, TextArea } from '../../../../../components';
import { StateIdentifier, useMetadataStore } from '../../../../../store';
import { MetadataType } from '../../../../../store/metadata';

interface OtherProps {
    readonly metadataIndex: number;
}

function Other(props: OtherProps): React.ReactElement {
    const { metadataIndex } = props;
    const metadata = useMetadataStore(state => state.metadatas[metadataIndex]);
    const { other, file } = metadata;
    const { idAsset } = file;
    const updateMetadataField = useMetadataStore(state => state.updateMetadataField);

    useEffect(() => {
        if (idAsset)
            updateMetadataField(metadataIndex, 'idAsset', idAsset, MetadataType.other);
    }, [metadataIndex, idAsset, updateMetadataField]);

    const onIdentifersChange = (identifiers: StateIdentifier[]): void => {
        updateMetadataField(metadataIndex, 'identifiers', identifiers, MetadataType.other);
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateMetadataField(metadataIndex, name, checked, MetadataType.other);
    };

    const setNameField = ({ target }): void => {
        const { name, value } = target;
        updateMetadataField(metadataIndex, name, value, MetadataType.other);
    };
    return (
        <Box mt='20px'>
            {idAsset && (
                <Box mb={2}>
                    <TextArea
                        label='Update Notes'
                        value={other.updateNotes}
                        name='updateNotes'
                        onChange={setNameField}
                        placeholder='Update notes...'
                    />
                </Box>
            )}
            <AssetIdentifiers
                systemCreated={other.systemCreated}
                identifiers={other.identifiers}
                onSystemCreatedChange={setCheckboxField}
                onAddIdentifer={onIdentifersChange}
                onUpdateIdentifer={onIdentifersChange}
                onRemoveIdentifer={onIdentifersChange}
            />
        </Box>
    );
}

export default Other;