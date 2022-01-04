/* eslint-disable camelcase */

import React, { useState } from 'react';
import { Box, TextField, Button, Select, MenuItem, InputLabel, FormControl } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { User_Status } from '../../../types/graphql';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles(({ typography, palette, breakpoints }) => ({
    searchUsersFilterButton: {
        backgroundColor: '#3854d0',
        color: 'white',
        width: '90px',
        height: '30px',
        outline: '2px hidden #8DABC4',
        '& :focus': {
            outline: '2px solid #8DABC4',
        }
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
        height: 30,
        marginLeft: 10,
        padding: '0px 5px',
        color: palette.primary.dark,
        borderRadius: 5,
        border: `0.5px solid ${palette.primary.contrastText}`,
        [breakpoints.down('lg')]: {
            height: 26
        }
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
        <Box className={classes.AdminUsersSearchFilterContainer}>
            <Box className={classes.AdminUsersSearchFilterSettingsContainer}>
                <label htmlFor='searchFilter' style={{ display: 'none' }}>Seach User</label>
                <TextField
                    className={classes.searchFilter}
                    placeholder='Search Packrat User'
                    type='search'
                    value={searchFilter}
                    id='searchFilter'
                    onChange={handleSearchFilterChange}
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
                        >
                            <MenuItem value={User_Status.EAll}>All</MenuItem>
                            <MenuItem value={User_Status.EActive}>Active</MenuItem>
                            <MenuItem value={User_Status.EInactive}>Inactive</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Button className={classes.searchUsersFilterButton} style={{ right: '25px' }} onClick={searchUsers}>
                    Search
                </Button>
            </Box>
            <Box className={classes.AdminUsersSearchFilterSettingsContainer2}>
                <Button className={classes.searchUsersFilterButton} onClick={() => history.push('/admin/users/create')}>Create</Button>
            </Box>
        </Box>
    );
}

export default AdminUsersFilter;
