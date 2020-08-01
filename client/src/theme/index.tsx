import { createMuiTheme, Theme } from '@material-ui/core/styles';
import createBreakpoints from '@material-ui/core/styles/createBreakpoints';
import Colors from './colors';
import { createTypographyOverrides } from './typography';

// https://material-ui.com/customization/palette/
const palette = {
    primary: {
        light: '#ECF5FD',
        main: '#0079C4',
        dark: '#2C405A',
        contrastText: '#8DABC4'
    },
    secondary: {
        main: '#F8D00D',
    }
};

const breakpoints = createBreakpoints({});

const overrides = createTypographyOverrides(breakpoints);

const theme: Theme = createMuiTheme({ palette, overrides });

export { theme as default, Colors };