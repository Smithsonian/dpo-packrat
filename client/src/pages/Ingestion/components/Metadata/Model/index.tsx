/**
 * Metadata - Model
 *
 * This component renders the metadata fields specific to model asset.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { AssetIdentifiers } from '../../../../../components';
import { StateIdentifier, useMetadataStore } from '../../../../../store';

const useStyles = makeStyles(() => ({
    container: {
        marginTop: 20
    }
}));

interface ModelProps {
    metadataIndex: number;
}

function Model(props: ModelProps): React.ReactElement {
    const { metadataIndex } = props;
    const classes = useStyles();
    const metadata = useMetadataStore(state => state.metadatas[metadataIndex]);
    const { model } = metadata;
    const updateModelField = useMetadataStore(state => state.updateModelField);

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateModelField(metadataIndex, name, checked);
    };

    const onIdentifersChange = (identifiers: StateIdentifier[]): void => {
        updateModelField(metadataIndex, 'identifiers', identifiers);
    };

    return (
        <Box className={classes.container}>
            <AssetIdentifiers
                systemCreated={model.systemCreated}
                identifiers={model.identifiers}
                onSystemCreatedChange={setCheckboxField}
                onAddIdentifer={onIdentifersChange}
                onUpdateIdentifer={onIdentifersChange}
                onRemoveIdentifer={onIdentifersChange}
            />
        </Box>
    );
}

export default Model;