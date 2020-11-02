/**
 * Metadata - Other
 *
 * This component renders the metadata fields for other asset types.
 */
import { Box } from '@material-ui/core';
import React from 'react';
import { AssetIdentifiers } from '../../../../../components';
import { StateIdentifier, useMetadataStore } from '../../../../../store';
import { MetadataType } from '../../../../../store/metadata';

interface OtherProps {
    readonly metadataIndex: number;
}

function Other(props: OtherProps): React.ReactElement {
    const { metadataIndex } = props;
    const metadata = useMetadataStore(state => state.metadatas[metadataIndex]);
    const { other } = metadata;
    const updateMetadataField = useMetadataStore(state => state.updateMetadataField);

    const onIdentifersChange = (identifiers: StateIdentifier[]): void => {
        updateMetadataField(metadataIndex, 'identifiers', identifiers, MetadataType.other);
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateMetadataField(metadataIndex, name, checked, MetadataType.other);
    };

    return (
        <Box mt='20px'>
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