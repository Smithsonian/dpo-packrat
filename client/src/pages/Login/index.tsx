import { Box, Container, Typography } from '@material-ui/core';
import { makeStyles, fade } from '@material-ui/core/styles';
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
import { actionOnKeyPress } from '../../utils/shared';
import useLoginForm, { ILoginForm } from './hooks/useLoginForm';
import Config from '../../config';
import LoginBackground from '../../assets/images/login-background.png';

const useStyles = makeStyles(({ palette, typography, spacing, breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        background: palette.primary.light,
        zIndex: 10,
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
    },
    loginFormContainer: {
        background: palette.background.paper,
        width: '25vw',
        borderRadius: 5,
        padding: 40,
        marginBottom: 20,
        boxShadow: `0px 1px 4px ${fade(palette.primary.dark, 0.2)}`,
        [breakpoints.down('md')]: {
            width: '30vw',
        },
        [breakpoints.down('sm')]: {
            width: '45vw',
        }
    },
    title: {
        fontWeight: typography.fontWeightRegular,
        color: 'black',
        textAlign: 'center',
        marginBottom: 5
    },
    subtitle: {
        color: palette.primary.contrastText,
        fontWeight: typography.fontWeightRegular,
        textAlign: 'center',
    },
    loginForm: {
        display: 'flex',
        flexDirection: 'column'
    },
    textFields: {
        marginTop: spacing(3),
        '&:nth-of-type(1)': {
            marginTop: spacing(4),
        }
    },
    loginButton: {
        height: 45,
        color: palette.background.paper,
        marginTop: spacing(3)
    },
    textFiledInput: {
        padding: 15,
        color: palette.grey[800],
        '&::placeholder': {
            color: palette.grey[600]
        }
    },
    contactUs: {
        cursor: 'pointer',
        marginLeft: 5
    },
    loginBackground: {
        position: 'absolute',
        height: '100vh',
        width: 'auto',
        zIndex: 5
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
        }
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

    const onContactUs = () => {
        const { contact } = Config;
        window.open(`mailto:${contact.email}`, '_blank');
    };

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                <Container className={classes.loginFormContainer}>
                    <Typography className={classes.title} variant='h4'>Packrat</Typography>
                    <Typography className={classes.subtitle} variant='body1'>3D DAMS/CMS</Typography>
                    <Typography className={classes.subtitle} variant='body1'>for the Smithsonian Institution</Typography>
                    <Formik
                        initialValues={initialValues}
                        validationSchema={loginValidationSchema}
                        onSubmit={onLogin}
                    >
                        {({ handleSubmit, handleChange, values, isSubmitting, submitForm }) => (
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
                                    variant='outlined'
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
                                    variant='outlined'
                                />
                                <LoadingButton
                                    type='submit'
                                    className={classes.loginButton}
                                    disableElevation
                                    variant='contained'
                                    color='primary'
                                    onKeyDown={({ key }) => actionOnKeyPress(key, 'Enter', submitForm)}
                                    loading={isSubmitting}
                                >
                                    Sign In
                                </LoadingButton>
                            </form>
                        )}
                    </Formik>
                </Container>
                <Typography
                    className={classes.subtitle}
                    variant='caption'
                >Want to know more?
                    <Typography
                        className={classes.contactUs}
                        color='primary'
                        variant='caption'
                        onClick={onContactUs}
                    >
                        Contact us
                    </Typography>
                </Typography>
            </Box>
            <img className={classes.loginBackground} src={LoginBackground} alt='login-background' />
        </Box>
    );
}

export default Login;
