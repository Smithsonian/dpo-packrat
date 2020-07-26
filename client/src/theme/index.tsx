import { createMuiTheme } from '@material-ui/core/styles';

// https://material-ui.com/customization/palette/
const palette = {
    primary: {
        main: '#1893CF'
    },
    secondary: {
        main: '#F8D00D',
    }
};

const theme = createMuiTheme({ palette });

export default theme;