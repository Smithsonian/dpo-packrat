import React from 'react';
import { Box, MenuItem, MenuList, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { toTitleCase } from '../../../constants/index';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router';

const useStyles = makeStyles(({ palette, spacing }) => ({
    AdminSidebarMenuRow: {
        maxHeight: '100%',
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
        marginTop: 2,
        '&.Mui-selected': {
            background: '#EBF5FD 0% 0% no-repeat padding-box'
        },
        '&:hover': {
            cursor: 'pointer',
            color: palette.primary.main,
            backgroundColor: palette.primary.light,
            '&.Mui-selected': {
                background: '#EBF5FD 0% 0% no-repeat padding-box'
            }
        }
    },
    AdminSidebarMenuContainer: {
        display: 'flex',
        flexDirection: 'column',
        borderRight: '2px solid #C5D9E8',
        padding: '1em 1em'
    },
    divider: {
        height: 1,
        width: '100%',
        marginTop: spacing(2),
        marginBottom: spacing(3),
        background: palette.grey[400]
    }
}));

function AdminSidebarMenuRow({ path, selected }: { path: string; selected: boolean }): React.ReactElement {
    const classes = useStyles();

    return (
        <MenuItem className={classes.AdminSidebarMenuRow} selected={selected}>
            <Link style={{ textDecoration: 'none', color: 'rgb(0, 110, 190)', width: '100%', height: '100%', fontSize: '0.875rem' }} to={`/admin/${path}`}>
                <Typography variant='inherit' noWrap>
                    {toTitleCase(path)}
                </Typography>
            </Link>
        </MenuItem>
    );
}

function AdminSidebarMenu(): React.ReactElement {
    const classes = useStyles();
    const location = useLocation();
    const path = location.pathname;

    return (
        <Box className={classes.AdminSidebarMenuContainer}>
            <MenuList>
                <AdminSidebarMenuRow path={'licenses'} selected={path.includes('licenses')} />
                <AdminSidebarMenuRow path={'users'} selected={path.includes('users')} />
                <Box className={classes.divider} />
                <AdminSidebarMenuRow path={'projects'} selected={path.includes('projects')} />
                <AdminSidebarMenuRow path={'units'} selected={path.includes('units')} />
                <AdminSidebarMenuRow path={'subjects'} selected={path.includes('subjects')} />
            </MenuList>
        </Box>
    );
}

export default AdminSidebarMenu;
