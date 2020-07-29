import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useContext } from 'react';
import { IoIosLogOut, IoIosNotifications, IoIosSearch } from 'react-icons/io';
import { MdSecurity } from 'react-icons/md';
import { Link, useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../api';
import { ROUTES, HOME_ROUTES, resolveRoute } from '../../constants';
import { AppContext } from '../../context';
import { Colors } from '../../theme';

const useStyles = makeStyles(({ palette, spacing, breakpoints }) => ({
    container: {
        display: 'flex',
        height: 60,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0px ${spacing(2)}px`,
        background: palette.primary.main,
        color: Colors.defaults.white,
        [breakpoints.down('xs')]: {
            padding: `0px ${spacing(2)}px`,
        }
    },
    logo: {
        cursor: 'pointer',
        paddingRight: spacing(2)
    },
    navOptionsContainer: {
        display: 'flex',
        flex: 1,
        justifyContent: 'flex-end'
    },
    navOption: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing(2),
        transition: 'all 250ms ease-in',
        cursor: 'pointer'
    }
}));

function Header(): React.ReactElement {
    const { user, updateUser } = useContext(AppContext);
    const classes = useStyles();
    const history = useHistory();

    const onLogout = async () => {
        try {
            const { success } = await API.logout();

            if (success) {
                updateUser(null);
                history.push(ROUTES.LOGIN);
            }
        } catch {
            toast.error('Failed to logout');
        }
    };

    return (
        <Box className={classes.container}>
            <Link className={classes.logo} to={resolveRoute(HOME_ROUTES.DASHBOARD)}>
                <MdSecurity size={30} color={Colors.defaults.white} />
            </Link>
            <Typography color='inherit' variant='body2'>{user?.Name}</Typography>
            <Box className={classes.navOptionsContainer}>
                <NavOption>
                    <IoIosSearch size={25} color={Colors.defaults.white} />
                </NavOption>
                <NavOption>
                    <IoIosNotifications size={25} color={Colors.defaults.white} />
                </NavOption>
                <NavOption onClick={onLogout}>
                    <IoIosLogOut size={25} color={Colors.defaults.white} />
                </NavOption>
            </Box>
        </Box>
    );
}

type NavOptionProps = {
    children: React.ReactChild;
    onClick?: () => void;
};

function NavOption(props: NavOptionProps): React.ReactElement {
    const { onClick, children } = props;
    const classes = useStyles();

    return (
        <Box className={classes.navOption} onClick={onClick}>
            {children}
        </Box>
    );
}

export default Header;
