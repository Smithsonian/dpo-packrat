/**
 * Packrat Client
 *
 * This is the root component of the client where we mount apollo, theme provider and
 * router.
 */
import { ApolloProvider } from '@apollo/client';
import { ThemeProvider, Box } from '@material-ui/core';
import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { BrowserRouter as Router, Routes, Route, Navigate /*, Outlet, */ } from 'react-router-dom';
import { Slide, toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { EnvBanner, ErrorBoundary, Loader, /*PrivateRoute*/ } from './components';
import { ROUTES } from './constants';
import './global/root.css';
import { apolloClient } from './graphql';
import { Home, Login } from './pages';
import * as serviceWorker from './serviceWorker';
import { useUserStore, useVocabularyStore, useLicenseStore, useUsersStore, useObjectMetadataStore, useControlStore } from './store';
import theme from './theme';
import { eVocabularySetID } from '@dpo-packrat/common';
import { createRoot } from 'react-dom/client'
import { AliveScope } from 'react-activation';
import Header from './components/shared/Header';
import SidePanel from './pages/Home/components/SidePanel';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        width: 'fit-content',
        minWidth: '100%'
    },
    content: {
        display: 'flex',
        flex: 1
    }
}));

function AppRouter(): React.ReactElement {
    const [loading, setLoading] = useState(true);
    const initialize = useUserStore(state => state.initialize);
    const [updateVocabularyEntries, getEntries] = useVocabularyStore(state => [state.updateVocabularyEntries, state.getEntries]);
    const updateLicenseEntries = useLicenseStore(state => state.updateLicenseEntries);
    const updateUsersEntries = useUsersStore(state => state.updateUsersEntries);
    const initializeMdmEntries = useObjectMetadataStore(state => state.initializeMdmEntries);
    const classes = useStyles();
    const [sideBarExpanded, toggleSidebar, initializeSidebarPosition] = useControlStore(state => [state.sideBarExpanded, state.toggleSidebar, state.initializeSidebarPosition]);
    const onToggle = (): void => toggleSidebar(!sideBarExpanded);

    useEffect(() => {
        initializeSidebarPosition();
    }, [initializeSidebarPosition]);
    const initializeUser = useCallback(async () => {
        try {
            await initialize();
            await updateVocabularyEntries();
            await updateLicenseEntries();
            await updateUsersEntries();
            await initializeMdmEntries(getEntries(eVocabularySetID.eEdanMDMFields).map(entry => entry.Term));
            setLoading(false);
        } catch {
            toast.error('Cannot connect to the server, please try again later');
        }
    }, [initialize, updateVocabularyEntries, updateLicenseEntries, updateUsersEntries, initializeMdmEntries, getEntries]);

    useEffect(() => {
        initializeUser();
    }, [initializeUser]);

    let content: React.ReactNode = <Loader size={40} />;

    let homeLayout = (
        <RequireAuth redirectTo={ROUTES.LOGIN}>
            <AliveScope>
                <Box className={classes.container}>
                    <Header />
                    <Box className={classes.content}>
                        <SidePanel isExpanded={sideBarExpanded} onToggle={onToggle} />
                        <Home />
                    </Box>
                </Box>
            </AliveScope>
        </RequireAuth>
    );

    if (!loading) {
        content = (
            <ErrorBoundary>
                <Routes>
                    <Route path={ROUTES.LOGIN} element={<RedirectAuth redirectTo={ROUTES.HOME}><Login /></RedirectAuth>} />
                    <Route path='*' element={homeLayout}>
                    </Route>
                </Routes>
            </ErrorBoundary>
        );
    }

    return <Router>{content}</Router>;
}

function App(): React.ReactElement {
    return (
        <ApolloProvider client={apolloClient}>
            <ThemeProvider theme={theme}>
                <Helmet>
                    <title>Packrat</title>
                </Helmet>
                <AppRouter />
                <ToastContainer
                    transition={Slide}
                    position='bottom-right'
                    autoClose={5000}
                    closeOnClick
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
                <EnvBanner renderFor={['development']} />
            </ThemeProvider>
        </ApolloProvider>
    );
}

function RequireAuth({ children, redirectTo }) {
    const [user] = useUserStore(state => [state.user]);
    return user ? children : <Navigate to={redirectTo} />;
}

function RedirectAuth({ children, redirectTo }) {
    const [user] = useUserStore(state => [state.user]);
    return user ? <Navigate to={redirectTo} /> : children;
}

serviceWorker.unregister();
const container = document.getElementById('root');
const root = createRoot(container!); // ! is typescript-specific. See https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#updates-to-client-rendering-apis
root.render(<App />);
