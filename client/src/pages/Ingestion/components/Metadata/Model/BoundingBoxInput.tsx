/**
 * BoundingBoxInput
 *
 * This is the component used in Model metadata component for
 * bounding box input.
 */
import { Box } from '@material-ui/core';
import React from 'react';
import { DebounceNumberInput, FieldType } from '../../../../../components';
import { ModelFields } from '../../../../../store';

interface BoundingBoxInputProps {
    model: ModelFields;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function BoundingBoxInput(props: BoundingBoxInputProps): React.ReactElement {
    const { model, onChange } = props;

    const rowFieldProps = { justifyContent: 'space-between' };

    return (
        <FieldType required={false} label='Bounding Box' direction='row' containerProps={rowFieldProps}>
            <Box display='flex' flex={1} flexDirection='column'>
                <Box display='flex' justifyContent='flex-end'>
                    <DebounceNumberInput value={model.boundingBoxP1X} name='boundingBoxP1X' onChange={onChange} />
                    <DebounceNumberInput value={model.boundingBoxP1Y} name='boundingBoxP1Y' onChange={onChange} />
                    <DebounceNumberInput value={model.boundingBoxP1Z} name='boundingBoxP1Z' onChange={onChange} />
                </Box>
                <Box display='flex' mt='5px' justifyContent='flex-end'>
                    <DebounceNumberInput value={model.boundingBoxP2X} name='boundingBoxP2X' onChange={onChange} />
                    <DebounceNumberInput value={model.boundingBoxP2Y} name='boundingBoxP2Y' onChange={onChange} />
                    <DebounceNumberInput value={model.boundingBoxP2Z} name='boundingBoxP2Z' onChange={onChange} />
                </Box>
            </Box>
        </FieldType>
    );
}

export default BoundingBoxInput;