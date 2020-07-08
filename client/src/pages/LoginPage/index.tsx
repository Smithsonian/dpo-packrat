import React from 'react';
import { Box, Typography, Container, TextField, Button, Icon } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
    container: {
        height: '100vh',
        background: palette.text.secondary,
    },
    loginTitle: {
        fontWeight: typography.fontWeightLight
    },
    loginSubtitle: {
        color: palette.grey[500],
        fontWeight: typography.fontWeightLight
    },
    textFields: {
        marginTop: spacing(2)
    },
    loginButton: {
        marginTop: spacing(5)
    },
    textFiledInput: {
        color: palette.grey[800],
        '&::placeholder': {
            color: palette.grey[600]
        }
    }
}));

const LoginPage = (): React.ReactElement => {
    const classes = useStyles();

    const InputProps = {
        classes: {
            input: classes.textFiledInput
        },
        disableUnderline: true
    };

    return (
        <Box
            className={classes.container}
            display='flex'
            flex={1}
            alignItems='center'
            justifyContent='center'
        >
            <Container maxWidth='xs'>
                <Typography className={classes.loginTitle} variant='h4' color='textPrimary'>Login</Typography>
                <Typography className={classes.loginSubtitle} variant='subtitle1'>Welcome to packrat</Typography>
                <Box display='flex' flexDirection='column'>
                    <TextField
                        className={classes.textFields}
                        required
                        focused
                        label='Email'
                        type='email'
                        placeholder='example@si.edu'
                        InputProps={InputProps}
                    />
                    <TextField
                        className={classes.textFields}
                        required
                        focused
                        label='Password'
                        type='password'
                        placeholder='password'
                        InputProps={InputProps}
                    />
                    <Button className={classes.loginButton} variant='outlined' color='primary' endIcon={<Icon>login</Icon>}>
                        Login
                    </Button>
                </Box>
            </Container>
        </Box>
    );
};

export default LoginPage;
