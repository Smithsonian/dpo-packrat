/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * IdInputField
 *
 * This component renders id input fields used in metadata components.
 */
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import FieldType from '../shared/FieldType';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    input: {
        width: '50%',
        outline: 'none',
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        padding: 8,
        borderRadius: 5,
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        [breakpoints.down('lg')]: {
            fontSize: '0.8em',
            minWidth: 160,
            maxWidth: 160,
        }
    }
}));

interface InputFieldProps {
    label: string;
    value?: number | string | null;
    name: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    required?: boolean;
    viewMode?: boolean;
    disabled?: boolean;
}

function InputField(props: InputFieldProps): React.ReactElement {
    const { label, name, value, onChange, type, required = false, viewMode = false, disabled = false } = props;
    const classes = useStyles();

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } };

    return (
        <FieldType
            required={required}
            label={label}
            direction='row'
            containerProps={rowFieldProps}
            width={viewMode ? 'auto' : undefined}
        >
            <DebounceInput
                element='input'
                disabled={disabled}
                // @ts-ignore
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