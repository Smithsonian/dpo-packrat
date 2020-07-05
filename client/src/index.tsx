import React from 'react';
import ReactDOM from 'react-dom';
import './global/root.css';
import { LoginPage } from './pages';
import { ThemeProvider } from '@material-ui/core';
import theme from './theme';

function App(): React.ReactElement {
    return (
        <ThemeProvider theme={theme}>
            <LoginPage />
        </ThemeProvider>
    );
}


ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);
