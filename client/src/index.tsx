import React, { useEffect, useContext, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from '@apollo/react-hooks';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import './global/root.css';
import { Home, Login, About, Dashboard } from './pages';
import { Header, PrivateRoute, PublicRoute } from './components';
import { ThemeProvider } from '@material-ui/core';
import theme from './theme';
import { Routes } from './constants';
import { apolloClient } from './graphql';
import { AppContextProvider, AppContext } from './context';
import { getAuthenticatedUser } from './utils/auth';

function AppRouter(): React.ReactElement {
    const [loading, setLoading] = useState(true);
    const { user, updateUser } = useContext(AppContext);

    const initialize = useCallback(async () => {
        if (!user) {
            const authenticatedUser = await getAuthenticatedUser();
            updateUser(authenticatedUser);
            setLoading(false);
        }
    }, [user, updateUser]);

    useEffect(() => {
        initialize();
    }, [initialize]);

    return (
        <Router>
            {!loading ? (
                <>
                    <Route exact path={[Routes.HOME, Routes.LOGIN, Routes.ABOUT]} component={Header} />
                    <Switch>
                        <PublicRoute exact path={Routes.HOME} component={Home} />
                        <PrivateRoute exact path={Routes.DASHBOARD} component={Dashboard} />
                        <PublicRoute restricted exact path={Routes.LOGIN} component={Login} />
                        <PublicRoute exact path={Routes.ABOUT} component={About} />
                    </Switch>
                </>
            ) : null}
        </Router>
    );
}

function App(): React.ReactElement {
    return (
        <ApolloProvider client={apolloClient}>
            <AppContextProvider>
                <ThemeProvider theme={theme}>
                    <AppRouter />
                </ThemeProvider>
            </AppContextProvider>
        </ApolloProvider>
    );
}


ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);
