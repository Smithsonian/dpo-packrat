import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Typography from '@material-ui/core/Typography';
import { toTitleCase } from '../../../constants/index';
import { Link } from 'react-router-dom';

const useStyles = makeStyles({
    AdminSidebarMenuRow: {
        maxHeight: '100%',
        background: '#ECF5FD 0% 0% no-repeat padding-box',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '0.8rem',
        width: 160,
        transition: 'all 250ms ease-in',
        textDecoration: 'none',
        overflow: 'hidden',
        borderRadius: 5,
        marginTop: 2
    },
    AdminSidebarMenuContainer: {
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid #C5D9E8',
        padding: '1em 1em'
    }
});

function AdminSidebarMenuRow({ path }: { path: string }) {
    const classes = useStyles();

    return (
        <Link style={{ textDecoration: 'none', color: '#0093EE' }} to={`/admin/${path}`}>
            <MenuItem className={classes.AdminSidebarMenuRow}>
                <Typography variant='inherit' noWrap>
                    {toTitleCase(path)}
                </Typography>
            </MenuItem>
        </Link>
    );
}

function AdminSidebarMenu() {
    const classes = useStyles();
    const adminRoutes = ['users'];

    return (
        <Box className={classes.AdminSidebarMenuContainer}>
            <MenuList>
                {adminRoutes.map(route => {
                    return <AdminSidebarMenuRow path={route} key={route} />;
                })}
            </MenuList>
        </Box>
    );
}

export default AdminSidebarMenu;
