import { createMuiTheme } from '@material-ui/core/styles';
import Colors from './colors';

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

const theme = createMuiTheme({ palette });

export { theme as default, Colors };