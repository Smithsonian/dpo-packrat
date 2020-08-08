import { Box, Container, Icon, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Field, Formik, FormikHelpers } from 'formik';
import { TextField } from 'formik-material-ui';
import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../api';
import { LoadingButton } from '../../components';
import { ROUTES } from '../../constants';
import { AppContext } from '../../context';
import { getAuthenticatedUser } from '../../utils/auth';
import useLoginForm, { ILoginForm } from './hooks/useLoginForm';

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
        height: 40,
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
    const { updateUser } = useContext(AppContext);
    const classes = useStyles();
    const history = useHistory();

    const { initialValues, loginValidationSchema } = useLoginForm();

    const InputProps = {
        classes: {
            input: classes.textFiledInput
        },
        disableUnderline: true
    };

    const onLogin = async (values: ILoginForm, actions: FormikHelpers<ILoginForm>): Promise<void> => {
        const { email, password } = values;
        const { setSubmitting } = actions;

        try {
            const { success, message } = await API.login(email, password);
            setSubmitting(false);

            if (success) {
                const authenticatedUser = await getAuthenticatedUser();
                updateUser(authenticatedUser);
                toast.success('Welcome to Packrat');
                history.push(ROUTES.HOME);
            } else {
                toast.error(message);
            }
        } catch ({ message }) {
            toast.error(message);
        }
    };

    return (
        <Box className={classes.container}>
            <Container maxWidth='xs'>
                <Typography className={classes.loginTitle} variant='h4' color='primary'>Login</Typography>
                <Typography className={classes.loginSubtitle} variant='body1'>Welcome to packrat</Typography>
                <Formik
                    initialValues={initialValues}
                    validationSchema={loginValidationSchema}
                    onSubmit={onLogin}
                >
                    {({ handleSubmit, handleChange, values, isSubmitting }) => (
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
                                placeholder='password'
                                InputProps={InputProps}
                                component={TextField}
                            />
                            <LoadingButton
                                type='submit'
                                className={classes.loginButton}
                                variant='outlined'
                                color='primary'
                                endIcon={!isSubmitting && <Icon>login</Icon>}
                                loading={isSubmitting}
                            >
                                Login
                            </LoadingButton>
                        </form>
                    )}
                </Formik>
            </Container>
        </Box>
    );
}

export default Login;
