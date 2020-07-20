import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from '@apollo/react-hooks';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import './global/root.css';
import { Home, Login, About, Dashboard } from './pages';
import { Header } from './components';
import { ThemeProvider } from '@material-ui/core';
import theme from './theme';
import { Routes } from './constants';
import { configureApolloClient } from './graphql';

const client = configureApolloClient();

function App(): React.ReactElement {
    return (
        <ApolloProvider client={client}>
            <ThemeProvider theme={theme}>
                <Router>
                    <Route exact path={[Routes.HOME, Routes.LOGIN, Routes.ABOUT]} component={Header} />
                    <Switch>
                        <Route exact path={Routes.HOME} component={Home} />
                        <Route exact path={Routes.DASHBOARD} component={Dashboard} />
                        <Route exact path={Routes.LOGIN} component={Login} />
                        <Route exact path={Routes.ABOUT} component={About} />
                    </Switch>
                </Router>
            </ThemeProvider>
        </ApolloProvider>
    );
}


ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);
