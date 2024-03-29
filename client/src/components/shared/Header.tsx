/**
 * Header
 *
 * This component renders the header consistent across the app.
 */
import { Box, Typography, Button } from '@material-ui/core';
import { fade, makeStyles, createStyles } from '@material-ui/core/styles';
import React, { useEffect } from 'react';
import { DebounceInput } from 'react-debounce-input';
import { IoIosLogOut, IoIosHelp, IoIosSearch } from 'react-icons/io';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Logo from '../../assets/images/logo-packrat.square.png';
import { generateRepositoryUrl } from '../../utils/repository';
import { Selectors } from '../../config';
import { HOME_ROUTES, resolveRoute, ROUTES } from '../../constants';
import { useRepositoryStore, useUserStore } from '../../store';
import { Colors } from '../../theme';
import { confirmLeaveIngestion } from '../../pages/Ingestion';

const useStyles = makeStyles(({ palette, spacing, typography, breakpoints }) => createStyles({
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
        color: fade(Colors.defaults.white, 0.65),
        background: 'transparent',
        fontWeight: 400,
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
        },
        '&:focus': {
            border: '2px solid silver',
        },
        '&:not(:focus)': {
            borderStyle: 'none'
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
        outline: '1px solid white',
        color: 'white',
        width: '90px',
        height: '30px',
        // border: '1px solid white',
        '&:focus': {
            border: '2px solid silver',
        }
    }
}));

function Header(): React.ReactElement {
    const classes = useStyles();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { user, logout } = useUserStore();
    const [search, keyword, updateSearch, getFilterState, resetRepositoryFilter, updateRepositoryFilter, resetKeywordSearch] = useRepositoryStore(state => [
        state.search,
        state.keyword,
        state.updateSearch,
        state.getFilterState,
        state.resetRepositoryFilter,
        state.updateRepositoryFilter,
        state.resetKeywordSearch
    ]);

    useEffect(() => {
        updateSearch(search);
    }, [search, updateSearch]);

    const onLogout = async (): Promise<void> => {
        const isConfirmed = global.confirm('Are you sure you want to logout?');
        if (!isConfirmed) return;

        try {
            const { success } = await logout();

            if (success) {
                navigate(ROUTES.LOGIN);
            }
        } catch {
            toast.error('Failed to logout');
        }
    };

    const onHelp = async (): Promise<void> => {
        window.open('https://smithsonian.github.io/dpo-packrat/');
    };

    const onClick = (e) => {
        const leaveIngestion = confirmLeaveIngestion();
        if (!leaveIngestion) e.preventDefault();
    };

    const isRepository = pathname.includes(HOME_ROUTES.REPOSITORY);

    // Specific to search while in repository view
    const updateRepositorySearch = (): void => {
        const filterState = getFilterState();
        filterState.search = filterState.keyword;
        resetRepositoryFilter();
        updateRepositoryFilter(filterState, false);
        const repositoryURL = generateRepositoryUrl(filterState);
        const route: string = resolveRoute(HOME_ROUTES.REPOSITORY);
        navigate(route + repositoryURL);
    };

    // General search function when in different views
    const onSearch = (): void => {
        const leaveIngestion = confirmLeaveIngestion();
        if (!leaveIngestion) return;

        const route: string = resolveRoute(HOME_ROUTES.REPOSITORY);
        resetRepositoryFilter();
        const filterState = getFilterState();
        filterState.search = filterState.keyword;
        updateRepositoryFilter(filterState, false);
        navigate(route);
    };

    // Filter and keyword clear when in Repository
    const clearSearchAndUpdateRepositorySearch = (): void => {
        resetKeywordSearch();
        resetRepositoryFilter(true, true);
        updateRepositorySearch();
    };

    return (
        <Box className={classes.container}>
            <Box display='flex' alignItems='center'>
                <Link className={classes.logo} to={resolveRoute(HOME_ROUTES.REPOSITORY)} onClick={onClick}>
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
                pushes navigate to the repository view and lets react hooks handle the search with the filters held in state. While
                in repository view, the search needs to reconstruct the URL based on the state of the search and then re-initialize the tree */}
                <DebounceInput
                    title='Search Repository'
                    element='input'
                    className={classes.search}
                    name='search'
                    value={keyword}
                    onChange={({ target }) => updateSearch(target.value)}
                    onKeyPress={e => {
                        if (e.key === 'Enter' && isRepository) {
                            updateRepositorySearch();
                        } else if (e.key === 'Enter' && !isRepository) {
                            onSearch();
                        }
                    }}
                    forceNotifyByEnter
                    debounceTimeout={400}
                    placeholder='Search Repository'
                />
            </Box>
            <React.Fragment>
                <NavOption onClick={isRepository ? updateRepositorySearch : onSearch}>
                    <Button variant='outlined' className={classes.headerButton}>
                        Search
                    </Button>
                </NavOption>
                <NavOption onClick={isRepository ? clearSearchAndUpdateRepositorySearch : resetKeywordSearch}>
                    <Button variant='outlined' className={classes.headerButton}>
                        Clear
                    </Button>
                </NavOption>
            </React.Fragment>
            <Box className={classes.navOptionsContainer}>
                <NavOption onClick={onHelp}>
                    <IoIosHelp size={45} color={Colors.defaults.white} />
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
