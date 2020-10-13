import { Box, Typography } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { IoIosLogOut, IoIosNotifications, IoIosSearch } from 'react-icons/io';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Logo from '../../assets/images/logo-packrat.square.png';
import { HOME_ROUTES, resolveRoute, ROUTES } from '../../constants';
import { useRepositoryFilterStore, useUserStore } from '../../store';
import { Colors } from '../../theme';

const useStyles = makeStyles(({ palette, spacing, typography, breakpoints }) => ({
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
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        marginLeft: 50,
        padding: 5,
        width: '40vw',
        minWidth: '30vw',
        borderRadius: 5,
        border: `0.25px solid ${fade(Colors.defaults.white, 0.65)}`,
        [breakpoints.down('lg')]: {
            marginLeft: 30,
        },
    },
    search: {
        height: 25,
        width: '100%',
        fontSize: 18,
        marginLeft: 5,
        outline: 'none',
        border: 'none',
        color: fade(Colors.defaults.white, 0.65),
        background: 'transparent',
        fontFamily: typography.fontFamily,
        [breakpoints.down('lg')]: {
            height: 20,
            fontSize: 14,
        },
        '&::placeholder': {
            color: fade(Colors.defaults.white, 0.65),
            fontStyle: 'italic'
        },
        '&::-moz-placeholder': {
            fontStyle: 'italic'
        }
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
    const { pathname } = useLocation();
    const { user, logout } = useUserStore();
    const [search, updateSearch] = useRepositoryFilterStore(state => [state.search, state.updateSearch]);

    const onSearch = (): void => {
        const route: string = resolveRoute(HOME_ROUTES.REPOSITORY);
        history.push(route);
    };

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

    const isRepository = pathname === resolveRoute(HOME_ROUTES.REPOSITORY);

    return (
        <Box className={classes.container}>
            <Box display='flex' alignItems='center'>
                <Link className={classes.logo} to={resolveRoute(HOME_ROUTES.DASHBOARD)}>
                    <img style={{ height: 30, width: 30 }} src={Logo} alt='packrat' />
                </Link>
                <Typography color='inherit' variant='body2'>{user?.Name}</Typography>
            </Box>
            {isRepository && (
                <Box className={classes.searchBox}>
                    <IoIosSearch size={20} color={fade(Colors.defaults.white, 0.65)} />
                    <DebounceInput
                        element='input'
                        className={classes.search}
                        name='search'
                        value={search}
                        onChange={({ target }) => updateSearch(target.value)}
                        forceNotifyByEnter
                        debounceTimeout={400}
                        placeholder='Search...'
                    />
                </Box>
            )}
            <Box className={classes.navOptionsContainer}>
                {!isRepository && (
                    <NavOption onClick={onSearch}>
                        <IoIosSearch size={25} color={Colors.defaults.white} />
                    </NavOption>
                )}
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
