/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * CheckboxField
 *
 * This component renders checkbox field used in ingestion and repository UI.
 */
import { Checkbox } from '@material-ui/core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

import { ViewableProps } from '../../types/repository';
import { getUpdatedCheckboxProps } from '../../utils/repository';
import { withDefaultValueBoolean } from '../../utils/shared';
import FieldType from '../shared/FieldType';

interface CheckboxFieldProps extends ViewableProps {
    label: string;
    name: string;
    value: boolean | null;
    onChange: ((event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void) | undefined;
    required?: boolean;
    valueLeftAligned?: boolean;
    gridValue?: number;
    gridLabel?: number;
    padding?: string;
    gridGap?: string;
    containerStyle?: any;
}

export const CheckboxNoPadding = withStyles({
    root: {
        border: '0px',
        padding: '0px'
    }
})(Checkbox);

function CheckboxField(props: CheckboxFieldProps): React.ReactElement {
    const { label, name, value, onChange, required = false, viewMode = false, disabled = false, updated = false, valueLeftAligned = false, gridValue, gridLabel, padding, gridGap, containerStyle } = props;
    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0, ...containerStyle } };
    const checkbox = (
        <CheckboxNoPadding
            name={name}
            disabled={disabled}
            checked={withDefaultValueBoolean(value, false)}
            onChange={onChange}
            {...getUpdatedCheckboxProps(updated)}
            inputProps={{ 'title': name }}
            size='small'
        />
    );

    return (
        <FieldType
            required={required}
            label={label}
            direction='row'
            containerProps={rowFieldProps}
            width={viewMode ? 'auto' : undefined}
            valueLeftAligned={valueLeftAligned}
            gridValue={gridValue}
            gridLabel={gridLabel}
            padding={padding}
            gridGap={gridGap}
        >
            {checkbox}
        </FieldType>
    );
}

export default CheckboxField;