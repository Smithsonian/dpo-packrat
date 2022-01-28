/* eslint-disable react/jsx-max-props-per-line */

/**
 * SelectField
 *
 * This component renders select input fields used in metadata components.
 */
import { MenuItem, Select } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { VocabularyOption } from '../../store';
import { ViewableProps } from '../../types/repository';
import FieldType from '../shared/FieldType';

export const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    select: {
        width: ({ selectFitContent }: SelectFieldProps) => selectFitContent ? 'fit-content' : '54%',
        padding: '0px 10px',
        background: palette.background.paper,
        border: ({ updated }: SelectFieldProps) => `1px solid ${fade(updated ? palette.secondary.main : palette.primary.contrastText, 0.4)}`,
        backgroundColor: ({ updated }: SelectFieldProps) => (updated ? palette.secondary.light : palette.background.paper),
        borderRadius: 5,
        fontFamily: typography.fontFamily,
        [breakpoints.down('lg')]: {
            fontSize: '0.8em',
            minWidth: 180,
        },
        height: ({ selectHeight }: SelectFieldProps ) => selectHeight ? selectHeight : undefined,
        '& .MuiSelect-selectMenu': {
            textOverflow: 'clip'
        }
    }
}));

export interface SelectFieldProps extends ViewableProps {
    label: string;
    value: number | null;
    name: string;
    options: VocabularyOption[];
    error?: boolean;
    width?: string;
    onChange: (event: React.ChangeEvent<unknown>) => void;
    valueLeftAligned?: boolean;
    gridLabel?: number;
    gridValue?: number;
    padding?: string;
    selectFitContent?: boolean;
    selectHeight?: string;
    gridGap?: string;
}

function SelectField(props: SelectFieldProps): React.ReactElement {
    const { label, value, name, width, required, error, options, onChange, viewMode = false, disabled = false, valueLeftAligned = false, gridLabel, gridValue, padding, gridGap } = props;

    const classes = useStyles(props);

    const rowFieldProps = { alignItems: 'center', style: { borderRadius: 0 } };

    return (
        <FieldType
            required={required ? required : false}
            error={error || false}
            label={label}
            direction='row'
            containerProps={rowFieldProps}
            width={width || viewMode ? 'auto' : undefined}
            valueLeftAligned={valueLeftAligned}
            gridLabel={gridLabel}
            gridValue={gridValue}
            padding={padding}
            gridGap={gridGap}
        >
            <Select value={value || ''} className={classes.select} name={name} onChange={onChange} disabled={disabled} disableUnderline inputProps={{ 'title': `${name} select`, style: { width: '100%' } }}>
                {options.map(({ idVocabulary, Term }, index) => (
                    <MenuItem key={index} value={idVocabulary}>
                        {Term}
                    </MenuItem>
                ))}
            </Select>
        </FieldType>
    );
}

export default SelectField;
