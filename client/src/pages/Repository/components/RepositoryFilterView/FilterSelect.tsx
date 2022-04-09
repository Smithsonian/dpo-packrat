/* eslint-disable react/jsx-max-props-per-line */
/**
 * FilterSelect
 *
 * This component renders select input fields used in RepositoryFilterView component.
 */
import { Box, MenuItem, Select, InputLabel } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useRepositoryStore } from '../../../../store';
import { FilterOption } from './RepositoryFilterOptions';
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

interface FilterSelectProps {
    label: string;
    name: string;
    options: FilterOption[];
    multiple?: boolean;
}

function FilterSelect(props: FilterSelectProps): React.ReactElement {
    const { label, name, multiple, options } = props;
    const { href: url } = window.location;
    let isModal: boolean = false;
    if (url.includes('details') || url.includes(HOME_ROUTES.INGESTION))
        isModal = true;

    const classes = useStyles();

    const [value, updateFilterValue] = useRepositoryStore(state => [state[name], state.updateFilterValue]);

    const onChange = ({ target }) => {
        let { value } = target;

        if (multiple) {
            value = value.sort();
        }

        updateFilterValue(name, value, isModal);
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
            {(name === 'has' || name === 'missing') && value.length < 1 ? (
                <Select
                    id={name}
                    value={value || []}
                    multiple={multiple || false}
                    className={classes.select}
                    name={name}
                    onChange={onChange}
                    disableUnderline
                    inputProps={inputProps}
                    renderValue={selected => {
                        if ((selected as string[]).length === 0) {
                            return <span>(Ignore)</span>;
                        }

                        return (selected as string[]).join(', ');
                    }}
                    displayEmpty
                    SelectDisplayProps={{ style: { borderRadius: '5px' } }}
                >
                    {options.map(({ label, value }: FilterOption, index) => {
                        return (
                            <MenuItem key={index} value={value}>
                                {label}
                            </MenuItem>
                        );
                    })}
                </Select>
            ) : (
                <Select
                    id={name}
                    value={value || []}
                    multiple={multiple || false}
                    className={classes.select}
                    name={name}
                    onChange={onChange}
                    disableUnderline
                    inputProps={inputProps}
                    SelectDisplayProps={{ style: { borderRadius: '5px' } }}
                >
                    {options.map(({ label, value }: FilterOption, index) => (
                        <MenuItem key={index} value={value}>
                            {label}
                        </MenuItem>
                    ))}
                </Select>
            )}
        </Box>
    );
}

export default FilterSelect;
