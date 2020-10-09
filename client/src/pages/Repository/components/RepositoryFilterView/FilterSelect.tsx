import { Box, MenuItem, Select, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

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
}

function FilterSelect(props: FilterSelectProps): React.ReactElement {
    const { label, name } = props;

    const classes = useStyles();

    const onChange = (v) => {
        console.log(v);
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
                value={0}
                className={classes.select}
                name={name}
                onChange={onChange}
                disableUnderline
                inputProps={inputProps}
            >
                {[0, 1, 2, 3].map((v, index) => <MenuItem key={index} value={v}>{v}</MenuItem>)}
            </Select>
        </Box>
    );
}

export default FilterSelect;