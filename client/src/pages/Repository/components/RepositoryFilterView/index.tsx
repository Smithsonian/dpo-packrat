import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { RepositoryFilter } from '../../index';
import { DebounceInput } from 'react-debounce-input';
import { motion } from 'framer-motion';
import { eSystemObjectType } from '../../../../types/server';
import { RepositoryIcon } from '../../../../components';
import { Colors, palette } from '../../../../theme';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        background: palette.primary.light,
        borderRadius: 10,
        padding: 20,
        marginBottom: 10,
        [breakpoints.down('lg')]: {
            padding: 10,
            borderRadius: 5
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
        [breakpoints.down('lg')]: {
            height: 20,
            fontSize: 14,
            padding: '5px 0px'
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
        [breakpoints.down('lg')]: {
            minWidth: 100,
            width: 100
        },
        '&:not(:first-child)': {
            marginLeft: 10
        }
    },
    filterSelected: {
        color: palette.background.paper,
        background: palette.primary.main
    },
    filterText: {
        marginLeft: 10,
        [breakpoints.down('lg')]: {
            fontSize: 10
        }
    }
}));

interface RepositoryFilterViewProps {
    filter: RepositoryFilter;
    onChange: (field: string, value: string | boolean) => void;
}

function RepositoryFilterView(props: RepositoryFilterViewProps): React.ReactElement {
    const { filter, onChange } = props;
    const classes = useStyles();

    const CheckboxFilters = [
        {
            value: filter.units,
            name: 'units',
            type: eSystemObjectType.eUnit
        },
        {
            value: filter.projects,
            name: 'projects',
            type: eSystemObjectType.eProject
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
                {CheckboxFilters.map(({ value, name, type }, index: number) => {
                    const selected = value;
                    const textColor = selected ? palette.primary.main : Colors.defaults.white;
                    const backgroundColor = selected ? Colors.defaults.white : palette.primary.contrastText;

                    const iconProps = { objectType: type, textColor, backgroundColor };

                    return (
                        <motion.div
                            key={index}
                            className={`${classes.filter} ${!value || classes.filterSelected}`}
                            initial='hidden'
                            animate='visible'
                            onClick={() => onChange(name, !value)}
                            whileTap={{ scale: 0.95 }}
                        >
                            <RepositoryIcon {...iconProps} />
                            <Typography className={classes.filterText} variant='caption' color='inherit'>
                                {name.toUpperCase()}
                            </Typography>
                        </motion.div>
                    );
                })}
            </Box>
        </Box>
    );
}

export default RepositoryFilterView;
