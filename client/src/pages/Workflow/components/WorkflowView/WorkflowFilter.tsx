import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Typography, Select, MenuItem, InputLabel } from '@material-ui/core';
import { useWorkflowStore, useVocabularyStore, useUsersStore } from '../../../../store';
import { getWorkflowFilterOptions } from '../WorkflowFilterOptions';
import { LoadingButton } from '../../../../components';
import { Colors } from '../../../../theme';
import DatePicker from 'react-datepicker';
import parseISO from 'date-fns/parseISO';
import '../../../../global/datepicker.css';

const useStyles = makeStyles(({ palette }) => ({
    selectContainer: {
        display: 'flex',
        flexDirection: 'column',
        marginRight: 20,
        height: 'fit-content'
    },
    container: {
        display: 'flex',
        height: 'fit-content',
        background: palette.primary.light,
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        transition: '250ms height ease'
    },
    label: {
        fontSize: '0.8em',
        color: palette.primary.dark
    },
    select: {
        width: 160,
        height: 30,
        marginLeft: 10,
        padding: '0px 5px',
        fontSize: '0.8em',
        color: palette.primary.dark,
        borderRadius: 5,
        border: `0.5px solid ${palette.primary.contrastText}`
    },
    selectLong: {
        width: 223,
        height: 30,
        marginLeft: 10,
        padding: '0px 5px',
        fontSize: '0.8em',
        color: palette.primary.dark,
        borderRadius: 5,
        border: `0.5px solid ${palette.primary.contrastText}`
    },
    icon: {
        color: palette.primary.contrastText
    },
    btn: {
        width: 'fit-content',
        color: Colors.defaults.white,
        height: 30,
        marginRight: 2
    },
    link: {
        textDecoration: 'none'
    },
    dateDiv: {
        marginLeft: 10
    },
    toText: {
        fontSize: '0.8em',
        color: palette.primary.dark,
        margin: '0px 4px',
        display: 'inline'
    }
}));

export type FilterOption = {
    label: string;
    value: number;
};

interface FilterSelectProps {
    label: string;
    name: string;
    options: FilterOption[];
    multiple?: boolean;
    long?: boolean;
}

interface FilterDateProps {
    label: string;
    name: string;
}

function WorkflowFilter(): React.ReactElement {
    const classes = useStyles(false);
    const getEntries = useVocabularyStore(state => state.getEntries);
    const getUsersFilterOptions = useUsersStore(state => state.getUsersFilterOptions);
    const [/*loading,*/ resetWorkflowFilters, fetchWorkflowList] = useWorkflowStore(state => [/*state.loading,*/ state.resetWorkflowFilters, state.fetchWorkflowList]);
    const { workflowTypeOptions, jobTypeOptions, stateOptions, initiatorOptions, ownerOptions } = getWorkflowFilterOptions(getUsersFilterOptions(), getEntries);

    return (
        <Box className={classes.container} mt={2}>
            <Box className={classes.selectContainer}>
                <FilterSelect multiple label='Workflow Type' name='workflowType' options={workflowTypeOptions} />
                <FilterSelect multiple label='Job Type' name='jobType' options={jobTypeOptions} />
                <FilterSelect multiple label='State' name='state' options={stateOptions} />
            </Box>

            <Box className={classes.selectContainer}>
                <FilterSelect multiple
                    label='Initiator'
                    name='initiator'
                    options={initiatorOptions}
                    long
                />
                <FilterSelect
                    multiple
                    label='Owner'
                    name='owner'
                    options={ownerOptions}
                    long
                />
                <FilterDate label='Date from' name='dateCreated' />
            </Box>
            <Box display='flex' flexDirection='row'>
                <LoadingButton
                    className={classes.btn}
                    disableElevation
                    loaderSize={15}
                    loading={false}
                    onClick={() => fetchWorkflowList()}
                >
                    Search
                </LoadingButton>
                <LoadingButton className={classes.btn} disableElevation loading={false} onClick={() => resetWorkflowFilters()}>
                    Clear
                </LoadingButton>
            </Box>
        </Box>
    );
}

function FilterSelect(props: FilterSelectProps): React.ReactElement {
    const { label, name, multiple, options, long } = props;

    const classes = useStyles(true);
    const [value, updateFilterValue] = useWorkflowStore(state => [state[name], state.updateFilterValue]);

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
            <InputLabel id={name}>
                <Typography className={classes.label}>{label}</Typography>
            </InputLabel>
            <Select
                value={value || []}
                multiple={multiple || false}
                className={long ? classes.selectLong : classes.select}
                name={name}
                onChange={onChange}
                disableUnderline
                inputProps={inputProps}
                id={name}
            >
                {options.map(({ label, value }: FilterOption, index) => (
                    <MenuItem key={index} value={value}>
                        {label}
                    </MenuItem>
                ))}
            </Select>
        </Box>
    );
}

function FilterDate(props: FilterDateProps): React.ReactElement {
    const { label } = props;
    const classes = useStyles();
    // eslint-disable-next-line prefer-const
    let [dateFrom, dateTo, updateFilterValue] = useWorkflowStore(state => [state.dateFrom, state.dateTo, state.updateFilterValue]);

    const onDate = (name: string, date: string | null | undefined) => {
        if (date == null) updateFilterValue(name, null);
        else {
            const timestamp = Date.parse(date);
            if (!isNaN(timestamp)) updateFilterValue(name, new Date(timestamp));
        }
    };

    if (typeof dateFrom === 'string') dateFrom = parseISO(dateFrom);
    if (typeof dateTo === 'string') dateTo = parseISO(dateTo);

    return (
        <Box display='flex' alignItems='center' mb={1}>
            <Typography className={classes.label}>{label}</Typography>
            <div className={classes.dateDiv}>
                <DatePicker
                    selected={dateFrom}
                    onChange={date => onDate('dateFrom', date)}
                    isClearable
                    title='Date From'
                />
                <Typography className={classes.toText}>to</Typography>
                <DatePicker
                    selected={dateTo}
                    onChange={date => onDate('dateTo', date)}
                    isClearable
                    title='Date To'
                />
            </div>
        </Box>
    );
}

export default WorkflowFilter;
