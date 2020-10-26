/**
 * Packrat Client
 *
 * This is the root component of the client where we mount apollo, theme provider and
 * router.
 */
import { ApolloProvider } from '@apollo/client';
import { ThemeProvider } from '@material-ui/core';
import React, { useCallback, useEffect, useState } from 'react';
import { AliveScope } from 'react-activation';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Switch } from 'react-router-dom';
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ErrorBoundary, Loader, PrivateRoute, PublicRoute } from './components';
import { ROUTES } from './constants';
import './global/root.css';
import { apolloClient } from './graphql';
import { Home, Login } from './pages';
import * as serviceWorker from './serviceWorker';
import { useUserStore } from './store';
import theme from './theme';

function AppRouter(): React.ReactElement {
    const [loading, setLoading] = useState(true);
    const initialize = useUserStore(state => state.initialize);

    const initializeUser = useCallback(async () => {
        await initialize();
        setLoading(false);
    }, [initialize]);

    useEffect(() => {
        initializeUser();
    }, [initializeUser]);

    let content: React.ReactNode = <Loader size={40} />;

    if (!loading) {
        content = (
            <ErrorBoundary>
                <Switch>
                    <PublicRoute restricted exact path={ROUTES.LOGIN} component={Login} />
                    <PrivateRoute path={ROUTES.HOME}>
                        <AliveScope>
                            <Home />
                        </AliveScope>
                    </PrivateRoute>
                </Switch>
            </ErrorBoundary>
        );
    }

    return <Router>{content}</Router>;
}

function App(): React.ReactElement {
    return (
        <ApolloProvider client={apolloClient}>
            <ThemeProvider theme={theme}>
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
            </ThemeProvider>
        </ApolloProvider>
    );
}

serviceWorker.unregister();
ReactDOM.render(<App />, document.getElementById('root'));
