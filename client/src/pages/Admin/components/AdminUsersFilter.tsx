/* eslint-disable camelcase */

import React, { useState } from 'react';
import { Box, TextField, Button, Select, MenuItem, InputLabel, FormControl, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { User_Status } from '../../../types/graphql';
import { useHistory } from 'react-router-dom';
import Clear from '@material-ui/icons/Clear';

const useStyles = makeStyles(({ typography, palette }) => ({
    searchUsersFilterButton: {
        backgroundColor: '#3854d0',
        color: 'white',
        width: '75px',
        height: '25px',
        outline: '2px hidden #8DABC4',
        '& :focus': {
            outline: '2px solid #8DABC4',
        },
        fontSize: '0.8rem'
    },
    filterContainer: {
        display: 'flex',
        justifyContent: 'space-around',
        width: 'max-content',
        backgroundColor: 'rgb(255, 255, 224)',
        padding: '10px 10px',
        fontSize: '0.8rem',
        outline: '1px solid rgba(141, 171, 196, 0.4)',
        borderRadius: 5
    },
    searchFilterContainerLeft: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        width: '80%',
        columnGap: 10,
    },
    searchFilterContainerRight: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        height: '100%',
        width: '20%'
    },
    formField: {
        backgroundColor: 'white',
        borderRadius: '4px'
    },
    searchFilter: {
        width: '250px'
    },
    filterLabel: {
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        fontSize: 'inherit',
        color: 'black'
    },
    select: {
        minWidth: 70,
        width: 'fit-content',
        height: 25,
        marginLeft: 10,
        color: palette.primary.dark,
        borderRadius: 5,
        border: `0.5px solid ${palette.primary.contrastText}`,
        fontSize: 'inherit'
    },
    labelSelectContainer: {
        display: 'flex',
        alignItems: 'center',
        width: 'fit-content'
    }
}));

function AdminUsersFilter({ queryUsersByFilter }: { queryUsersByFilter: (newActive: User_Status, newSearchText: string) => Promise<void> }): React.ReactElement {
    const [searchFilter, setSearchFilter] = useState('');
    const [activeStatusFilter, setActiveStatusFilter] = useState(User_Status.EAll);
    const history = useHistory();
    const classes = useStyles();

    const handleActiveStatusFilterChange = e => {
        setActiveStatusFilter(e.target.value);
    };

    const handleSearchFilterChange = e => {
        setSearchFilter(e.target.value);
    };

    const searchUsers = () => {
        queryUsersByFilter(activeStatusFilter, searchFilter);
    };

    return (
        <Box className={classes.filterContainer}>
            <Box className={classes.searchFilterContainerLeft}>
                <label htmlFor='searchFilter' style={{ display: 'none' }}>Seach User</label>
                <TextField
                    className={classes.searchFilter}
                    placeholder='Search Packrat User'
                    value={searchFilter}
                    id='searchFilter'
                    onChange={handleSearchFilterChange}
                    onKeyPress={e => {
                        if (e.key === 'Enter') searchUsers();
                    }}
                    InputProps={{
                        endAdornment: searchFilter.length ? (
                            <IconButton size='small' onClick={() => { setSearchFilter(''); setActiveStatusFilter(User_Status.EAll); queryUsersByFilter(User_Status.EAll, ''); }}>
                                <Clear style={{ height: '16px' }} />
                            </IconButton>
                        ) : null,
                        style: { fontSize: '0.8rem' }
                    }}
                />
                <Box className={classes.labelSelectContainer}>
                    <InputLabel htmlFor='activeStatus' className={classes.filterLabel}>Active</InputLabel>
                    <FormControl className={classes.filterLabel}>
                        <Select
                            id='activeStatus'
                            disableUnderline
                            value={activeStatusFilter}
                            className={classes.select}
                            onChange={handleActiveStatusFilterChange}
                            name='activeStatus'
                            displayEmpty
                            SelectDisplayProps={{ style: { paddingLeft: '5px', borderRadius: '5px' } }}
                        >
                            <MenuItem value={User_Status.EAll}>All</MenuItem>
                            <MenuItem value={User_Status.EActive}>Active</MenuItem>
                            <MenuItem value={User_Status.EInactive}>Inactive</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Button
                    className={classes.searchUsersFilterButton}
                    onClick={searchUsers}
                    variant='contained'
                    disableElevation
                >
                    Search
                </Button>
            </Box>
            <Box className={classes.searchFilterContainerRight}>
                <Button className={classes.searchUsersFilterButton} onClick={() => history.push('/admin/users/create')} variant='contained' disableElevation>Create</Button>
            </Box>
        </Box>
    );
}

export default AdminUsersFilter;
