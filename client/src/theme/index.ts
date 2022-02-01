/**
 * Theme
 *
 * Material UI theme palette for packrat client.
 * https://material-ui.com/customization/palette
 */
import { createMuiTheme, Theme } from '@material-ui/core/styles';
// import createBreakpoints from '@material-ui/core/styles/createBreakpoints';
import Colors from './colors';
import { createOverrides } from './typography';

export const palette = {
    primary: {
        light: '#ECF5FD',
        main: '#0079C4',
        dark: '#2C405A',
        contrastText: '#8DABC4'
    },
    secondary: {
        light: '#FFFCD1',
        main: '#F8D00D',
    },
    background: {
        default: '#FFFFFF'
    }
};

// const breakpoints = createBreakpoints({});

const overrides = createOverrides();

const theme: Theme = createMuiTheme({ palette, overrides });

export { theme as default, Colors };
