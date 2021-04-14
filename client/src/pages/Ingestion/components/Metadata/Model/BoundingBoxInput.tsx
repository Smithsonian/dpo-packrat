/* eslint-disable react/jsx-max-props-per-line */

/**
 * BoundingBoxInput
 *
 * This is the component used in Model metadata component for
 * bounding box input.
 */
import { Box } from '@material-ui/core';
import React from 'react';
import { DebounceNumberInput, FieldType } from '../../../../../components';
// import { ModelDetailFields } from '../../../../../types/graphql';
import { ViewableProps } from '../../../../../types/repository';
import { isFieldUpdated } from '../../../../../utils/repository';

interface BoundingBoxInputProps extends ViewableProps {
    modelFields?: null;
    boundingBoxP1X?: number | null;
    boundingBoxP1Y?: number | null;
    boundingBoxP1Z?: number | null;
    boundingBoxP2X?: number | null;
    boundingBoxP2Y?: number | null;
    boundingBoxP2Z?: number | null;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function BoundingBoxInput(props: BoundingBoxInputProps): React.ReactElement {
    const { modelFields, boundingBoxP1X, boundingBoxP1Y, boundingBoxP1Z, boundingBoxP2X, boundingBoxP2Y, boundingBoxP2Z, onChange, viewMode = false, disabled = false } = props;

    const rowFieldProps = { justifyContent: 'space-between' };

    const details = {
        boundingBoxP1X,
        boundingBoxP1Y,
        boundingBoxP1Z,
        boundingBoxP2X,
        boundingBoxP2Y,
        boundingBoxP2Z
    };

    return (
        <FieldType required={false} label='Bounding Box' direction='row' containerProps={rowFieldProps} width={viewMode ? 'auto' : undefined}>
            <Box display='flex' flex={1} flexDirection='column'>
                <Box display='flex' justifyContent='flex-end'>
                    <DebounceNumberInput
                        updated={viewMode ? isFieldUpdated(details, modelFields, 'boundingBoxP1X') : false}
                        disabled={disabled}
                        value={details.boundingBoxP1X}
                        name='boundingBoxP1X'
                        onChange={onChange}
                    />
                    <DebounceNumberInput
                        updated={viewMode ? isFieldUpdated(details, modelFields, 'boundingBoxP1Y') : false}
                        disabled={disabled}
                        value={details.boundingBoxP1Y}
                        name='boundingBoxP1Y'
                        onChange={onChange}
                    />
                    <DebounceNumberInput
                        updated={viewMode ? isFieldUpdated(details, modelFields, 'boundingBoxP1Z') : false}
                        disabled={disabled}
                        value={details.boundingBoxP1Z}
                        name='boundingBoxP1Z'
                        onChange={onChange}
                    />
                </Box>

                <Box display='flex' mt='5px' justifyContent='flex-end'>
                    <DebounceNumberInput
                        updated={viewMode ? isFieldUpdated(details, modelFields, 'boundingBoxP2X') : false}
                        disabled={disabled}
                        value={details.boundingBoxP2X}
                        name='boundingBoxP2X'
                        onChange={onChange}
                    />
                    <DebounceNumberInput
                        updated={viewMode ? isFieldUpdated(details, modelFields, 'boundingBoxP2Y') : false}
                        disabled={disabled}
                        value={details.boundingBoxP2Y}
                        name='boundingBoxP2Y'
                        onChange={onChange}
                    />
                    <DebounceNumberInput
                        updated={viewMode ? isFieldUpdated(details, modelFields, 'boundingBoxP2Z') : false}
                        disabled={disabled}
                        value={details.boundingBoxP2Z}
                        name='boundingBoxP2Z'
                        onChange={onChange}
                    />
                </Box>
            </Box>
        </FieldType>
    );
}

export default BoundingBoxInput;
