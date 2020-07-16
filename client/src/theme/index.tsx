import { createMuiTheme } from '@material-ui/core/styles';

const palette = {
    primary: {
        main: '#1893CF'
    },
    secondary: {
        main: '#F8D00D',
    },
    text: {
        primary: '#1893CF',
        secondary: '#fff'
    }
};

const theme = createMuiTheme({ palette });

export default theme;