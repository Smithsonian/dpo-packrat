/**
 * CheckboxField
 *
 * This component renders checkbox field used in ingestion and repository UI.
 */
import { Checkbox } from '@material-ui/core';
import React from 'react';
import { withDefaultValueBoolean } from '../../utils/shared';
import FieldType from '../shared/FieldType';

interface CheckboxFieldProps {
    label: string;
    name: string;
    value: boolean | null;
    onChange: ((event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void) | undefined;
    required?: boolean;
    viewMode?: boolean;
}

function CheckboxField(props: CheckboxFieldProps): React.ReactElement {
    const { label, name, value, onChange, required = false, viewMode = false } = props;
    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } };

    return (
        <FieldType
            required={required}
            label={label}
            direction='row'
            containerProps={rowFieldProps}
            width={viewMode ? 'auto' : undefined}
        >
            <Checkbox
                name={name}
                checked={withDefaultValueBoolean(value, false)}
                color='primary'
                onChange={onChange}
            />
        </FieldType>
    );
}

export default CheckboxField;