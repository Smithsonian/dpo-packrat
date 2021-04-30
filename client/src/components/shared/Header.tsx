/**
 * Header
 *
 * This component renders the header consistent across the app.
 */
import { Box, Typography, Button } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { IoIosLogOut, IoIosNotifications, IoIosSearch } from 'react-icons/io';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Logo from '../../assets/images/logo-packrat.square.png';
import { generateRepositoryUrl } from '../../utils/repository';
import { Selectors } from '../../config';
import { HOME_ROUTES, resolveRoute, ROUTES } from '../../constants';
import { useRepositoryStore, useUserStore } from '../../store';
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
        paddingRight: spacing(2)
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        marginLeft: 35,
        padding: '5px 10px',
        width: '40vw',
        minWidth: '30vw',
        borderRadius: 5,
        backgroundColor: fade(Colors.defaults.white, 0.1),
        [breakpoints.down('lg')]: {
            marginLeft: 30
        }
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
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        [breakpoints.down('lg')]: {
            height: 20,
            fontSize: 14
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
    },
    headerButton: {
        color: 'white',
        width: '90px',
        height: '30px',
        border: 'solid 1px white'
    }
}));

function Header(): React.ReactElement {
    const classes = useStyles();
    const history = useHistory();
    const { pathname } = useLocation();
    const { user, logout } = useUserStore();
    const [keyword, updateSearch, getFilterState, initializeTree, resetRepositoryFilter, updateRepositoryFilter, resetKeywordSearch] = useRepositoryStore(state => [
        state.keyword,
        state.updateSearch,
        state.getFilterState,
        state.initializeTree,
        state.resetRepositoryFilter,
        state.updateRepositoryFilter,
        state.resetKeywordSearch
    ]);

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

    const isRepository = pathname.includes(HOME_ROUTES.REPOSITORY);

    // Specific to search while in repository view
    const updateRepositorySearch = (): void => {
        const filterState = getFilterState();
        filterState.repositoryRootType = [];
        filterState.search = filterState.keyword;
        updateRepositoryFilter(filterState);
        const updatedFilterState = getFilterState();
        const repositoryURL = generateRepositoryUrl(updatedFilterState);
        const route: string = resolveRoute(HOME_ROUTES.REPOSITORY);
        console.log(`*** src/components/shared/Header.tsx Header updateRepositorySearch history.push(${route + repositoryURL}`);
        history.push(route + repositoryURL);
        initializeTree();
    };

    // General search function when in different views
    const onSearch = (): void => {
        const route: string = resolveRoute(HOME_ROUTES.REPOSITORY);
        resetRepositoryFilter();
        const filterState = getFilterState();
        filterState.search = filterState.keyword;
        updateRepositoryFilter(filterState);
        console.log(`*** src/components/shared/Header.tsx Header onSearch history.push(${route}`);
        history.push(route);
    };

    // Filter and keyword clear when in Repository
    const clearSearchAndUpdateRepositorySearch = (): void => {
        resetKeywordSearch();
        resetRepositoryFilter();
        updateRepositorySearch();
    };

    return (
        <Box className={classes.container}>
            <Box display='flex' alignItems='center'>
                <Link className={classes.logo} to={resolveRoute(HOME_ROUTES.REPOSITORY)}>
                    <img style={{ height: 30, width: 30 }} src={Logo} alt='packrat' />
                </Link>
                <Typography color='inherit' variant='body2'>
                    {user?.Name}
                </Typography>
            </Box>
            <Box className={classes.searchBox}>
                <IoIosSearch size={20} color={fade(Colors.defaults.white, 0.65)} />
                {/* Note:
                The way the search in repository view is slightly different from other views. In other views, search simply
                pushes history to the repository view and lets react hooks handle the search with the filters held in state. While
                in repository view, the search needs to reconstruct the URL based on the state of the search and then re-initialize the tree */}
                {isRepository ? (
                    <DebounceInput
                        element='input'
                        className={classes.search}
                        name='search'
                        value={keyword}
                        onChange={({ target }) => updateSearch(target.value)}
                        onKeyPress={e => {
                            if (e.key === 'Enter') {
                                updateRepositorySearch();
                            }
                        }}
                        forceNotifyByEnter
                        debounceTimeout={400}
                        placeholder='Search Repository'
                    />
                ) : (
                    <DebounceInput
                        element='input'
                        className={classes.search}
                        name='search'
                        value={keyword}
                        onChange={({ target }) => updateSearch(target.value)}
                        onKeyPress={e => {
                            if (e.key === 'Enter') {
                                onSearch();
                            }
                        }}
                        forceNotifyByEnter
                        debounceTimeout={400}
                        placeholder='Search Repository'
                    />
                )}
            </Box>
            {isRepository ? (
                <React.Fragment>
                    <NavOption onClick={updateRepositorySearch}>
                        <Button variant='outlined' className={classes.headerButton}>
                            Search
                        </Button>
                    </NavOption>
                    <NavOption onClick={clearSearchAndUpdateRepositorySearch}>
                        <Button variant='outlined' className={classes.headerButton}>
                            Clear
                        </Button>
                    </NavOption>
                </React.Fragment>
            ) : (
                <React.Fragment>
                    <NavOption onClick={onSearch}>
                        <Button variant='outlined' className={classes.headerButton}>
                            Search
                        </Button>
                    </NavOption>
                    <NavOption onClick={resetKeywordSearch}>
                        <Button variant='outlined' className={classes.headerButton}>
                            Clear
                        </Button>
                    </NavOption>
                </React.Fragment>
            )}

            <Box className={classes.navOptionsContainer}>
                <NavOption>
                    <IoIosNotifications size={25} color={Colors.defaults.white} />
                </NavOption>
                <NavOption onClick={onLogout}>
                    <IoIosLogOut id={Selectors.AUTH.LOGOUT_BUTTON} size={25} color={Colors.defaults.white} />
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
