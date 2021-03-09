import React, { useState } from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
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

function AdminUsersFilter({ handleActiveUpdate }: { handleActiveUpdate: (input: string) => void }): React.ReactElement {
    const [searchFilter, setSearchFilter] = useState('');
    const [activeStatusFilter, setActiveStatusFilter] = useState('All');
    const classes = useStyles();

    const handleActiveStatusFilterChange = e => {
        setActiveStatusFilter(e.target.value);
    };

    const handleSearchFilterChange = e => {
        setSearchFilter(e.target.value);
    };

    const searchUsers = () => {
        handleActiveUpdate(activeStatusFilter);
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
                <FormControl variant='outlined'>
                    <Select value={activeStatusFilter} className={classes.formField} style={{ height: '30px', width: '100px' }} onChange={handleActiveStatusFilterChange}>
                        <MenuItem value={0}>All</MenuItem>
                        <MenuItem value={1}>Active</MenuItem>
                        <MenuItem value={2}>Inactive</MenuItem>
                    </Select>
                </FormControl>
                <Button className={classes.searchUsersFilterButton} onClick={searchUsers}>
                    Search
                </Button>
            </Box>
            <Box className={classes.AdminUsersSearchFilterSettingsContainer2}>
                <Link style={{ textDecoration: 'none', color: '#F5F6FA' }} to='/admin/user/create'>
                    <Button className={classes.searchUsersFilterButton}>Add User</Button>
                </Link>
            </Box>
        </Box>
    );
}

export default AdminUsersFilter;
