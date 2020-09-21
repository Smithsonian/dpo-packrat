import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { RepositoryFilter } from '../../index';
import { DebounceInput } from 'react-debounce-input';
import { HiCheckCircle } from 'react-icons/hi';
import { motion } from 'framer-motion';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        background: palette.primary.light,
        borderRadius: 10,
        padding: 20,
        [breakpoints.down('md')]: {
            padding: 10,
            borderRadius: 5,
        }
    },
    search: {
        height: 30,
        width: '100%',
        padding: '10px 0px',
        fontSize: 18,
        outline: 'none',
        border: 'none',
        background: 'transparent',
        borderBottom: `1px solid ${palette.primary.main}`,
        fontFamily: typography.fontFamily,
        [breakpoints.down('md')]: {
            height: 20,
            fontSize: 14,
            padding: '5px 0px',
        },
        '&::placeholder': {
            fontStyle: 'italic'
        },
        '&::-moz-placeholder': {
            fontStyle: 'italic'
        }
    },
    filter: {
        display: 'flex',
        alignItems: 'center',
        minWidth: 125,
        width: 125,
        padding: '8px 10px',
        borderRadius: 5,
        cursor: 'pointer',
        color: palette.primary.contrastText,
        background: palette.background.paper,
        [breakpoints.down('md')]: {
            minWidth: 100,
            width: 100,
            padding: '5px 10px',
        },
        '&:not(:first-child)': {
            marginLeft: 10
        },
    },
    filterSelected: {
        color: palette.background.paper,
        background: palette.primary.main,
    },
    filterText: {
        marginLeft: 10,
        [breakpoints.down('md')]: {
            marginLeft: 5,
            fontSize: 10
        },
    }
}));

interface RepositoryFilterViewProps {
    filter: RepositoryFilter;
    onChange: (field: string, value: string | boolean) => void
}

function RepositoryFilterView(props: RepositoryFilterViewProps): React.ReactElement {
    const { filter, onChange } = props;
    const classes = useStyles();

    const CheckboxFilters = [
        {
            value: filter.units,
            name: 'units'
        },
        {
            value: filter.projects,
            name: 'projects'
        }
    ];

    return (
        <Box className={classes.container}>
            <DebounceInput
                element='input'
                className={classes.search}
                name='search'
                value={''}
                onChange={() => null}
                forceNotifyByEnter
                debounceTimeout={400}
                placeholder='Search...'
            />
            <Box display='flex' mt={2}>
                {CheckboxFilters.map(({ value, name }, index: number) => (
                    <motion.div
                        key={index}
                        className={`${classes.filter} ${!value || classes.filterSelected}`}
                        initial='hidden'
                        animate='visible'
                        onClick={() => onChange(name, !value)}
                        whileTap={{ scale: 0.95 }}
                    >
                        <HiCheckCircle size={20} />
                        <Typography className={classes.filterText} variant='caption' color='inherit'>{name.toUpperCase()}</Typography>
                    </motion.div>
                ))}
            </Box>
        </Box>
    );
}

export default RepositoryFilterView;
