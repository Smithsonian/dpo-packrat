import React, { useContext } from 'react';
import { Box, Typography, Container, Button, Icon } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom';
import { Formik, Field } from 'formik';
import * as Yup from 'yup';
import { Routes } from '../../constants';
import API from '../../api';
import { getAuthenticatedUser } from '../../utils/auth';
import { AppContext } from '../../context';
import { toast } from 'react-toastify';
import { TextField } from 'formik-material-ui';

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
    container: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        background: palette.background.paper,
    },
    loginTitle: {
        fontWeight: typography.fontWeightLight
    },
    loginSubtitle: {
        color: palette.grey[500],
        fontWeight: typography.fontWeightLight
    },
    loginForm: {
        display: 'flex',
        flexDirection: 'column'
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

const validationSchema = () => Yup.object({
    email: Yup.string().required('Required'),
    password: Yup.string().required('Required')
});

function Login(): React.ReactElement {
    const { updateUser } = useContext(AppContext);
    const classes = useStyles();
    const history = useHistory();

    const initialValues = {
        email: 'test@si.edu',
        password: 'test@si.edu'
    };

    const InputProps = {
        classes: {
            input: classes.textFiledInput
        },
        disableUnderline: true
    };

    const onLogin = async (values, { setSubmitting }): Promise<void> => {
        const { email, password } = values;

        try {
            const { success, message } = await API.login(email, password);

            if (success) {
                const authenticatedUser = await getAuthenticatedUser();
                updateUser(authenticatedUser);
                toast.success('Welcome to Packrat');
                history.push(Routes.DASHBOARD);
            } else {
                toast.error(message);
            }
        } catch ({ message }) {
            toast.error(message);
        }

        setSubmitting(false);
    };

    return (
        <Box className={classes.container}>
            <Container maxWidth='xs'>
                <Typography className={classes.loginTitle} variant='h4' color='primary'>Login</Typography>
                <Typography className={classes.loginSubtitle} variant='subtitle1'>Welcome to packrat</Typography>
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={onLogin}
                >
                    {({ handleSubmit, handleChange, values }) => (
                        <form className={classes.loginForm} onSubmit={handleSubmit}>
                            <Field
                                value={values.email}
                                onChange={handleChange}
                                className={classes.textFields}
                                name='email'
                                label='Email'
                                type='email'
                                placeholder='example@si.edu'
                                InputProps={InputProps}
                                component={TextField}
                            />
                            <Field
                                value={values.password}
                                onChange={handleChange}
                                className={classes.textFields}
                                name='password'
                                label='Password'
                                type='password'
                                disabled
                                placeholder='password'
                                InputProps={InputProps}
                                component={TextField}
                            />
                            <Button
                                type='submit'
                                className={classes.loginButton}
                                variant='outlined'
                                color='primary'
                                endIcon={<Icon>login</Icon>}
                            >
                                Login
                            </Button>
                        </form>
                    )}
                </Formik>
            </Container>
        </Box>
    );
}

export default Login;
