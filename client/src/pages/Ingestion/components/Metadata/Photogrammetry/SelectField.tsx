import { MenuItem, Select } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { FieldType } from '../../../../../components';
import { VocabularyOption } from './index';

const useStyles = makeStyles(({ palette, typography }) => ({
    select: {
        width: 250,
        padding: '0px 10px',
        background: palette.background.paper,
        border: `1px solid ${palette.primary.contrastText}`,
        borderRadius: 5,
        fontFamily: typography.fontFamily
    },
}));

interface SelectFieldProps {
    label: string;
    value: number | null;
    name: string;
    options: VocabularyOption[];
    required?: boolean;
    error?: boolean;
    onChange: (event: React.ChangeEvent<unknown>) => void;
}

function SelectField(props: SelectFieldProps): React.ReactElement {
    const { label, value, name, required, error, options, onChange } = props;

    const classes = useStyles();


    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <FieldType
            required={required ? required : false}
            error={error || false}
            label={label}
            direction='row'
            containerProps={rowFieldProps}
        >
            <Select
                value={value}
                className={classes.select}
                name={name}
                onChange={onChange}
                disableUnderline
            >
                {options.map(({ idVocabulary, Term }, index) => <MenuItem key={index} value={idVocabulary}>{Term}</MenuItem>)}
            </Select>
        </FieldType>
    );
}

export default SelectField;