import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { IoIosLogOut, IoIosNotifications, IoIosSearch } from 'react-icons/io';
import { Link, useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import Logo from '../../assets/images/logo-packrat.square.png';
import { HOME_ROUTES, resolveRoute, ROUTES } from '../../constants';
import { useUser } from '../../store';
import { Colors } from '../../theme';

const useStyles = makeStyles(({ palette, spacing }) => ({
    container: {
        display: 'flex',
        height: 60,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0px 1.5rem',
        background: palette.primary.main,
        color: Colors.defaults.white
    },
    logo: {
        cursor: 'pointer',
        paddingRight: spacing(2),
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
    const classes = useStyles();
    const history = useHistory();
    const { user, logout } = useUser();

    const onLogout = async (): Promise<void> => {
        const isConfirmed = global.confirm('Are you sure you want to logout?');
        if (!isConfirmed) return;

        try {
            const { success } = await logout();

            if (success) {
                history.push(ROUTES.LOGIN);
            }
        } catch {
            toast.error('Failed to logout');
        }
    };

    return (
        <Box className={classes.container}>
            <Link className={classes.logo} to={resolveRoute(HOME_ROUTES.DASHBOARD)}>
                <img style={{ height: 30, width: 30 }} src={Logo} alt='packrat' />
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
    children: React.ReactNode;
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
