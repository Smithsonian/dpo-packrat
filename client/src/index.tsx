import React from 'react';
import ReactDOM from 'react-dom';
import './global/root.css';
import { Home, Login, About } from './pages';
import { Header } from './components';
import { ThemeProvider } from '@material-ui/core';
import theme from './theme';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Routes } from './constants';

function App(): React.ReactElement {
    return (
        <ThemeProvider theme={theme}>
            <Router>
                <Route path={[Routes.HOME, Routes.LOGIN, Routes.ABOUT]} component={Header} />
                <Switch>
                    <Route exact path={Routes.HOME} component={Home} />
                    <Route exact path={Routes.LOGIN} component={Login} />
                    <Route exact path={Routes.ABOUT} component={About} />
                </Switch>
            </Router>
        </ThemeProvider>
    );
}


ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);
