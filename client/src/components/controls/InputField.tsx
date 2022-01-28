/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * IdInputField
 *
 * This component renders id input fields used in metadata components.
 */
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { ViewableProps } from '../../types/repository';
import FieldType from '../shared/FieldType';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    input: {
        width: '50%',
        border: ({ updated }: InputFieldProps) => `1px solid ${fade(updated ? palette.secondary.main : palette.primary.contrastText, 0.4)}`,
        backgroundColor: ({ updated, error }: InputFieldProps) => error ? fade(palette.error.light, 0.3) : updated ? palette.secondary.light : palette.background.paper,
        padding: 8,
        borderRadius: 5,
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        [breakpoints.down('lg')]: {
            fontSize: '0.8em',
            minWidth: 160,
            maxWidth: 160,
        },
        height: ({ inputHeight }: InputFieldProps ) => inputHeight ? inputHeight : 3,
    }
}));

interface InputFieldProps extends ViewableProps {
    label: string;
    value?: number | string | null;
    name: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    error?: boolean;
    valueLeftAligned?: boolean;
    gridValue?: number;
    gridLabel?: number;
    padding?: string;
    inputHeight?: string;
    gridGap?: string;
}

function InputField(props: InputFieldProps): React.ReactElement {
    const { label, name, value, onChange, type, required = false, viewMode = false, disabled = false, valueLeftAligned = false, gridLabel, gridValue, padding, gridGap } = props;
    const classes = useStyles(props);

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } };

    return (
        <FieldType
            required={required}
            label={label}
            direction='row'
            containerProps={rowFieldProps}
            width={viewMode ? 'auto' : undefined}
            valueLeftAligned={valueLeftAligned}
            gridLabel={gridLabel}
            gridValue={gridValue}
            padding={padding}
            gridGap={gridGap}
        >
            <DebounceInput
                element='input'
                title={name}
                disabled={disabled}
                value={value || ''}
                className={classes.input}
                type={type}
                name={name}
                onChange={onChange}
                debounceTimeout={400}
            />
        </FieldType>
    );
}

export default InputField;