/**
 * BoundingBoxInput
 *
 * This is the component used in Model metadata component for
 * bounding box input.
 */
import { Box } from '@material-ui/core';
import React from 'react';
import { DebounceNumberInput, FieldType } from '../../../../../components';

interface BoundingBoxInputProps {
    boundingBoxP1X?: number | null;
    boundingBoxP1Y?: number | null;
    boundingBoxP1Z?: number | null;
    boundingBoxP2X?: number | null;
    boundingBoxP2Y?: number | null;
    boundingBoxP2Z?: number | null;
    viewMode?: boolean;
    disabled?: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function BoundingBoxInput(props: BoundingBoxInputProps): React.ReactElement {
    const { boundingBoxP1X, boundingBoxP1Y, boundingBoxP1Z, boundingBoxP2X, boundingBoxP2Y, boundingBoxP2Z, onChange, viewMode = false, disabled = false } = props;

    const rowFieldProps = { justifyContent: 'space-between' };

    return (
        <FieldType
            required={false}
            label='Bounding Box'
            direction='row'
            containerProps={rowFieldProps}
            width={viewMode ? 'auto' : undefined}
        >
            <Box display='flex' flex={1} flexDirection='column'>
                <Box display='flex' justifyContent='flex-end'>
                    <DebounceNumberInput disabled={disabled} value={boundingBoxP1X} name='boundingBoxP1X' onChange={onChange} />
                    <DebounceNumberInput disabled={disabled} value={boundingBoxP1Y} name='boundingBoxP1Y' onChange={onChange} />
                    <DebounceNumberInput disabled={disabled} value={boundingBoxP1Z} name='boundingBoxP1Z' onChange={onChange} />
                </Box>
                <Box display='flex' mt='5px' justifyContent='flex-end'>
                    <DebounceNumberInput disabled={disabled} value={boundingBoxP2X} name='boundingBoxP2X' onChange={onChange} />
                    <DebounceNumberInput disabled={disabled} value={boundingBoxP2Y} name='boundingBoxP2Y' onChange={onChange} />
                    <DebounceNumberInput disabled={disabled} value={boundingBoxP2Z} name='boundingBoxP2Z' onChange={onChange} />
                </Box>
            </Box>
        </FieldType>
    );
}

export default BoundingBoxInput;