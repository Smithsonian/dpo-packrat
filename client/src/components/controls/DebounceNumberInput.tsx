/**
 * DebounceNumberInput
 *
 * This is the component render debounced number input.
 */
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    input: {
        width: '16%',
        outline: 'none',
        border: (updated: boolean) => `1px solid ${fade(updated ? palette.secondary.main : palette.primary.contrastText, 0.4)}`,
        backgroundColor: (updated: boolean) => updated ? palette.secondary.light : palette.background.paper,
        padding: 8,
        borderRadius: 5,
        marginLeft: 5,
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        [breakpoints.down('lg')]: {
            fontSize: '0.8em',
            minWidth: 50,
            maxWidth: 50,
        }
    }
}));

interface DebounceNumberInputProps {
    value?: number | null;
    name: string;
    disabled?: boolean;
    updated?: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function DebounceNumberInput(props: DebounceNumberInputProps): React.ReactElement {
    const { value, name, onChange, disabled = false, updated = false } = props;
    const classes = useStyles(updated);

    return (
        <DebounceInput
            element='input'
            value={value || ''}
            className={classes.input}
            type='number'
            name={name}
            disabled={disabled}
            onChange={onChange}
            debounceTimeout={400}
        />
    );
}

export default DebounceNumberInput;