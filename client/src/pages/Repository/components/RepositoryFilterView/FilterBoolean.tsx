/* eslint-disable react/jsx-max-props-per-line */
/**
 * FilterBoolean
 *
 * A boolean filter control styled to match FilterSelect. Renders a labeled two-option
 * dropdown (false/true) and writes the value to the repository store through the same
 * updateFilterValue seam used by the other repository filters.
 */
import { Box, MenuItem, Select, InputLabel } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useRepositoryStore } from '../../../../store';
import { HOME_ROUTES } from '../../../../constants';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    label: {
        fontSize: '0.8em',
        color: palette.primary.dark
    },
    select: {
        width: 160,
        height: 30,
        marginLeft: 10,
        fontSize: '0.8em',
        color: palette.primary.dark,
        borderRadius: 5,
        border: `0.5px solid ${palette.primary.contrastText}`,
        [breakpoints.down('lg')]: {
            height: 26
        }
    },
    icon: {
        color: palette.primary.contrastText
    }
}));

interface FilterBooleanProps {
    label: string;
    name: string;
    falseLabel: string;
    trueLabel: string;
}

function FilterBoolean(props: FilterBooleanProps): React.ReactElement {
    const { label, name, falseLabel, trueLabel } = props;
    const { href: url } = window.location;
    let isModal: boolean = false;
    if (url.includes('details') || url.includes(HOME_ROUTES.INGESTION))
        isModal = true;

    const classes = useStyles();

    const [value, updateFilterValue] = useRepositoryStore(state => [state[name], state.updateFilterValue]);

    const onChange = ({ target }) => {
        updateFilterValue(name, target.value === 'true', isModal);
    };

    const inputProps = {
        classes: {
            icon: classes.icon
        }
    };

    return (
        <Box display='flex' alignItems='center' justifyContent='space-between' mb={1}>
            <InputLabel id={name} className={classes.label} htmlFor={name}>
                {label}
            </InputLabel>
            <Select
                id={name}
                value={value ? 'true' : 'false'}
                className={classes.select}
                name={name}
                onChange={onChange}
                disableUnderline
                inputProps={inputProps}
                SelectDisplayProps={{ style: { borderRadius: '5px' } }}
            >
                <MenuItem value='false'>{falseLabel}</MenuItem>
                <MenuItem value='true'>{trueLabel}</MenuItem>
            </Select>
        </Box>
    );
}

export default FilterBoolean;
