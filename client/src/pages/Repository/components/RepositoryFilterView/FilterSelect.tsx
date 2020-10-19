import { Box, MenuItem, Select, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useRepositoryStore } from '../../../../store';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    label: {
        fontSize: '0.8em',
        color: palette.primary.dark,
    },
    select: {
        width: 160,
        height: 30,
        marginLeft: 10,
        padding: '0px 5px',
        fontSize: '0.8em',
        color: palette.primary.dark,
        borderRadius: 5,
        border: `0.5px solid ${palette.primary.contrastText}`,
        [breakpoints.down('lg')]: {
            height: 26,
        }
    },
    icon: {
        color: palette.primary.contrastText,
    }
}));

interface FilterSelectProps {
    label: string;
    name: string;
    options: number[];
    multiple?: boolean;
}

function FilterSelect(props: FilterSelectProps): React.ReactElement {
    const { label, name, multiple, options } = props;
    const classes = useStyles();

    const [value, updateFilterValue] = useRepositoryStore(state => [state[name], state.updateFilterValue]);

    const onChange = ({ target }) => {
        let { value } = target;

        if (multiple) {
            value = value.sort();
        }

        updateFilterValue(name, value);
    };

    const inputProps = {
        classes: {
            icon: classes.icon
        }
    };

    return (
        <Box display='flex' alignItems='center' justifyContent='space-between' mb={1}>
            <Typography className={classes.label}>{label}</Typography>
            <Select
                value={value}
                multiple={multiple || false}
                className={classes.select}
                name={name}
                onChange={onChange}
                disableUnderline
                inputProps={inputProps}
            >
                {options.map((v, index) => <MenuItem key={index} value={v}>{v}</MenuItem>)}
            </Select>
        </Box>
    );
}

export default FilterSelect;