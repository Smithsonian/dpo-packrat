import React, { useState, useContext } from 'react';
import { Box, Typography, Container, TextField, Button, Icon } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom';
import { Routes } from '../../constants';
import API from '../../api';
import { getAuthenticatedUser } from '../../utils/auth';
import { AppContext } from '../../context';

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
    container: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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

function Login(): React.ReactElement {
    const { user, updateUser } = useContext(AppContext);
    const classes = useStyles();
    const history = useHistory();

    const [email, setEmail] = useState('test@si.edu');
    const [password, setPassword] = useState('test@si.edu');

    const InputProps = {
        classes: {
            input: classes.textFiledInput
        },
        disableUnderline: true
    };

    const onLogin = async () => {
        const { success } = await API.login(email, password);

        if (success) {
            const authenticatedUser = await getAuthenticatedUser();
            console.log(user);
            console.log(authenticatedUser);
            updateUser(authenticatedUser);
            history.push(Routes.DASHBOARD);
        }
    };

    return (
        <Box className={classes.container}>
            <Container maxWidth='xs'>
                <Typography className={classes.loginTitle} variant='h4' color='textPrimary'>Login</Typography>
                <Typography className={classes.loginSubtitle} variant='subtitle1'>Welcome to packrat</Typography>
                <Box display='flex' flexDirection='column'>
                    <TextField
                        value={email}
                        onChange={({ target }) => setEmail(target.value)}
                        className={classes.textFields}
                        required
                        focused
                        label='Email'
                        type='email'
                        placeholder='example@si.edu'
                        InputProps={InputProps}
                    />
                    <TextField
                        value={password}
                        onChange={({ target }) => setPassword(target.value)}
                        className={classes.textFields}
                        required
                        focused
                        label='Password'
                        type='password'
                        placeholder='password'
                        InputProps={InputProps}
                    />
                    <Button
                        onClick={onLogin}
                        className={classes.loginButton}
                        variant='outlined'
                        color='primary'
                        endIcon={<Icon>login</Icon>}
                    >
                        Login
                    </Button>
                </Box>
            </Container>
        </Box>
    );
}

export default Login;
