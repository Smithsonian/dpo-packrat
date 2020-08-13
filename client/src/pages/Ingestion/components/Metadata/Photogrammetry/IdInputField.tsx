import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { FieldType } from '../../../../../components';

const useStyles = makeStyles(({ palette, typography }) => ({
    input: {
        width: 220,
        outline: 'none',
        border: `1px solid ${palette.primary.contrastText}`,
        padding: '8px',
        borderRadius: 5,
        fontFamily: typography.fontFamily
    }
}));

interface IdInputFieldProps {
    label: string;
    value: number;
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
                value={value}
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