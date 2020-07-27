import React, { useEffect, useContext, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from '@apollo/react-hooks';
import { BrowserRouter as Router, Switch } from 'react-router-dom';
import './global/root.css';
import { Home, Login, About } from './pages';
import { PrivateRoute, PublicRoute } from './components';
import { ThemeProvider, CircularProgress, Box } from '@material-ui/core';
import theme from './theme';
import { Routes } from './constants';
import { apolloClient } from './graphql';
import { AppContextProvider, AppContext } from './context';
import { getAuthenticatedUser } from './utils/auth';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
            {loading ? (
                <Box display='flex' flex={1} alignItems='center' justifyContent='center'>
                    <CircularProgress color='primary' size={30} />
                </Box>
            ) : (
                <React.Fragment>
                    <Switch>
                        <PublicRoute restricted exact path={Routes.LOGIN} component={Login} />
                        <PublicRoute exact path={Routes.ABOUT} component={About} />
                        <PrivateRoute exact path={Routes.HOME} component={Home} />
                    </Switch>
                </React.Fragment>
            )}
        </Router>
    );
}

function App(): React.ReactElement {
    return (
        <ApolloProvider client={apolloClient}>
            <AppContextProvider>
                <ThemeProvider theme={theme}>
                    <AppRouter />
                    <ToastContainer
                        transition={Slide}
                        position='bottom-right'
                        autoClose={4000}
                        closeOnClick
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                    />
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
