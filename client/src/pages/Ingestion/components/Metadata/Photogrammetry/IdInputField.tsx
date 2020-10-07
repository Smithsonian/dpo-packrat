/* eslint-disable @typescript-eslint/ban-ts-comment */
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { FieldType } from '../../../../../components';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    input: {
        width: '50%',
        outline: 'none',
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        padding: 8,
        borderRadius: 5,
        fontFamily: typography.fontFamily,
        [breakpoints.down('lg')]: {
            fontSize: '0.8em',
            minWidth: 160,
            maxWidth: 160,
        }
    }
}));

interface IdInputFieldProps {
    label: string;
    value: number | null;
    name: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function IdInputField(props: IdInputFieldProps): React.ReactElement {
    const { label, name, value, onChange } = props;
    const classes = useStyles();

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <FieldType required={false} label={label} direction='row' containerProps={rowFieldProps}>
            <DebounceInput
                element='input'
                // @ts-ignore
                value={value || ''}
                className={classes.input}
                type='number'
                name={name}
                onChange={onChange}
                debounceTimeout={400}
            />
        </FieldType>
    );
}

export default IdInputField;