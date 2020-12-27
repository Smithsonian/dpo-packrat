/**
 * FilterDate
 *
 * This component renders date input fields used in RepositoryFilterView component.
 */
import DateFnsUtils from '@date-io/date-fns';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import React from 'react';
import { AiOutlineCalendar } from 'react-icons/ai';
import { useRepositoryStore } from '../../../../store';
import { palette } from '../../../../theme';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    label: {
        fontSize: '0.8em',
        color: palette.primary.dark,
    },
    toText: {
        fontSize: '0.8em',
        color: palette.primary.dark,
        margin: '0px 10px'
    },
    date: {
        width: 150,
        paddingLeft: 5,
        marginTop: 0,
        marginBottom: 0,
        borderRadius: 5,
        border: `0.5px solid ${palette.primary.contrastText}`,
        [breakpoints.down('lg')]: {
            height: 26,
        }
    },
}));

interface FilterDateProps {
    label: string;
    name: string;
}

function FilterDate(props: FilterDateProps): React.ReactElement {
    const { label, name } = props;
    const classes = useStyles();

    const [fromDate, toDate, updateFilterValue] = useRepositoryStore(state => [state.fromDate, state.toDate, state.updateFilterValue]);

    const onDate = (name: string, date: string | null | undefined) => {
        if (date) {
            updateFilterValue(name, new Date(date));
        }
    };

    const InputProps = {
        disableUnderline: true,
        style: {
            fontSize: '0.8em',
            color: palette.primary.dark
        }
    };

    const fromDateStyle = {
        marginLeft: 45
    };

    const keyboardIcon: React.ReactNode = <AiOutlineCalendar color={palette.primary.contrastText} size={20} />;

    const datePickerProps = {
        disableToolbar: true,
        format: 'MM/dd/yyyy',
        name,
        className: classes.date,
        keyboardIcon,
        InputProps
    };

    return (
        <Box display='flex' alignItems='center' justifyContent='space-between' mb={1}>
            <Typography className={classes.label}>{label}</Typography>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <KeyboardDatePicker
                    {...datePickerProps}
                    style={fromDateStyle}
                    value={fromDate}
                    onChange={(_, value) => onDate('fromDate', value)}
                    variant='inline'
                    margin='normal'

                />
                <Typography className={classes.toText}>to</Typography>
                <KeyboardDatePicker
                    {...datePickerProps}
                    value={toDate}
                    onChange={(_, value) => onDate('toDate', value)}
                    variant='inline'
                    margin='normal'
                />
            </MuiPickersUtilsProvider>
        </Box>
    );
}

export default FilterDate;