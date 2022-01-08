/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * CheckboxField
 *
 * This component renders checkbox field used in ingestion and repository UI.
 */
import { Checkbox, Tooltip } from '@material-ui/core';
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
    tooltip?: any;
}

const CheckboxNoPadding = withStyles({
    root: {
        border: '0px',
        padding: '0px'
    }
})(Checkbox);

function CheckboxField(props: CheckboxFieldProps): React.ReactElement {
    const { label, name, value, onChange, required = false, viewMode = false, disabled = false, updated = false, tooltip } = props;
    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } };
    const checkbox = (
        <CheckboxNoPadding
            name={name}
            disabled={disabled}
            checked={withDefaultValueBoolean(value, false)}
            onChange={onChange}
            {...getUpdatedCheckboxProps(updated)}
            inputProps={{ 'title': name }}
        />
    );
    return (
        <FieldType
            required={required}
            label={label}
            direction='row'
            containerProps={rowFieldProps}
            width={viewMode ? 'auto' : undefined}
        >
            {tooltip ? (
                <Tooltip {...tooltip}>
                    {checkbox}
                </Tooltip>
            ) : checkbox}
            {/* <CheckboxNoPadding
                name={name}
                disabled={disabled}
                checked={withDefaultValueBoolean(value, false)}
                onChange={onChange}
                {...getUpdatedCheckboxProps(updated)}
                inputProps={{ 'title': name }}
            /> */}
        </FieldType>
    );
}

export default CheckboxField;