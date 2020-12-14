/**
 * SelectField
 *
 * This component renders select input fields used in metadata components.
 */
import { MenuItem, Select } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { VocabularyOption } from '../../store';
import FieldType from '../shared/FieldType';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    select: {
        width: '54%',
        padding: '0px 10px',
        background: palette.background.paper,
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        borderRadius: 5,
        fontFamily: typography.fontFamily,
        [breakpoints.down('lg')]: {
            fontSize: '0.8em',
            minWidth: 180,
            maxWidth: 180,
        }
    },
}));

interface SelectFieldProps {
    label: string;
    value: number | null;
    name: string;
    options: VocabularyOption[];
    required?: boolean;
    error?: boolean;
    width?: string;
    onChange: (event: React.ChangeEvent<unknown>) => void;
}

function SelectField(props: SelectFieldProps): React.ReactElement {
    const { label, value, name, width, required, error, options, onChange } = props;

    const classes = useStyles();

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } };

    return (
        <FieldType
            required={required ? required : false}
            error={error || false}
            label={label}
            direction='row'
            containerProps={rowFieldProps}
            width={width || undefined}
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