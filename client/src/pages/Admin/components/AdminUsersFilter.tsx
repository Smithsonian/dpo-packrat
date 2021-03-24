/* eslint-disable camelcase */

import React, { useState } from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { User_Status } from '../../../types/graphql';
import { Link } from 'react-router-dom';

const useStyles = makeStyles({
    searchUsersFilterButton: {
        backgroundColor: '#687DDB',
        color: 'white',
        width: '90px',
        height: '30px'
    },
    AdminUsersSearchFilterContainer: {
        display: 'flex',
        justifyContent: 'space-around',
        height: '70px',
        width: '900px',
        backgroundColor: '#FFFCD1',
        paddingLeft: '20px',
        paddingRight: '20px'
    },
    AdminUsersSearchFilterSettingsContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        width: '80%'
    },
    AdminUsersSearchFilterSettingsContainer2: {
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
        width: '380px'
    }
});

function AdminUsersFilter({ queryUsersByFilter }: { queryUsersByFilter: (newActive: User_Status, newSearchText: string) => Promise<void> }): React.ReactElement {
    const [searchFilter, setSearchFilter] = useState('');
    const [activeStatusFilter, setActiveStatusFilter] = useState(User_Status.EAll);
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
        <Box className={classes.AdminUsersSearchFilterContainer}>
            <Box className={classes.AdminUsersSearchFilterSettingsContainer}>
                <TextField
                    className={classes.searchFilter}
                    placeholder='Search Packrat User'
                    type='search'
                    value={searchFilter}
                    id='searchFilter'
                    onChange={handleSearchFilterChange}
                />
                <p>Active</p>
                <FormControl variant='outlined' style={{ right: '25px' }}>
                    <Select value={activeStatusFilter} className={classes.formField} style={{ height: '30px', width: '100px' }} onChange={handleActiveStatusFilterChange}>
                        <MenuItem value={User_Status.EAll}>All</MenuItem>
                        <MenuItem value={User_Status.EActive}>Active</MenuItem>
                        <MenuItem value={User_Status.EInactive}>Inactive</MenuItem>
                    </Select>
                </FormControl>
                <Button className={classes.searchUsersFilterButton} style={{ right: '25px' }} onClick={searchUsers}>
                    Search
                </Button>
            </Box>
            <Box className={classes.AdminUsersSearchFilterSettingsContainer2}>
                <Link style={{ textDecoration: 'none', color: '#F5F6FA' }} to='/admin/user/create'>
                    <Button className={classes.searchUsersFilterButton}>Create</Button>
                </Link>
            </Box>
        </Box>
    );
}

export default AdminUsersFilter;
