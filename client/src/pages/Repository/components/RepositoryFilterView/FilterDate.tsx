/**
 * FilterDate
 *
 * This component renders date input fields used in RepositoryFilterView component.
 */
import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useRepositoryStore } from '../../../../store';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../../../global/datepicker.css';
import parseISO from 'date-fns/parseISO';

const useStyles = makeStyles(({ palette }) => ({
    label: {
        fontSize: '0.8em',
        color: palette.primary.dark,
    },
    toText: {
        fontSize: '0.8em',
        color: palette.primary.dark,
        margin: '0px 4px',
        display: 'inline',
    },
    datePicker: {
        fontSize: '0.88em',
        color: palette.primary.dark,
        zIndex: 100,
        borderRadius: 5,
        height: 26,
        width: 80,
        border: `0.5px solid ${palette.primary.contrastText}`,
    },
    dateDiv: {
        marginLeft: 45,
    },
}));

interface FilterDateProps {
    label: string;
    name: string;
}

function FilterDate(props: FilterDateProps): React.ReactElement {
    const { label } = props;
    const classes = useStyles();

    let [dateCreatedFrom, dateCreatedTo, updateFilterValue] = useRepositoryStore(state => [state.dateCreatedFrom, state.dateCreatedTo, state.updateFilterValue]); // eslint-disable-line prefer-const

    const onDate = (name: string, date: string | null | undefined) => {
        // console.log(`onDate ${name}: ${date}`);
        if (date == null) // or undefined
            updateFilterValue(name, null);
        else {
            const timestamp = Date.parse(date);
            if (!isNaN(timestamp))
                updateFilterValue(name, new Date(timestamp));
        }
    };

    if (typeof(dateCreatedFrom) === 'string')
        dateCreatedFrom = parseISO(dateCreatedFrom);
    if (typeof(dateCreatedTo) === 'string')
        dateCreatedTo = parseISO(dateCreatedTo);

    return (
        <Box display='flex' alignItems='center' mb={1}>
            <Typography className={classes.label}>{label}</Typography>
            <div className={classes.dateDiv}>
                <DatePicker
                    selected={dateCreatedFrom}
                    onChange={date => onDate('dateCreatedFrom', date)}
                    isClearable
                    title='Date Created From'
                />
                <Typography className={classes.toText}>to</Typography>
                <DatePicker
                    selected={dateCreatedTo}
                    onChange={date => onDate('dateCreatedTo', date)}
                    isClearable
                    title='Date Created To'
                />
            </div>
        </Box>
    );
}

export default FilterDate;