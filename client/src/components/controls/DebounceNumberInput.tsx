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
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
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
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function DebounceNumberInput(props: DebounceNumberInputProps): React.ReactElement {
    const { value, name, onChange } = props;
    const classes = useStyles();

    return (
        <DebounceInput
            element='input'
            value={value || ''}
            className={classes.input}
            type='number'
            name={name}
            onChange={onChange}
            debounceTimeout={400}
        />
    );
}

export default DebounceNumberInput;