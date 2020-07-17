import React from 'react';
import { Box, Container, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import PackratLogo from '../../assets/images/logo-packrat.png';
import { Link } from 'react-router-dom';
import { Routes } from '../../constants';

const useStyles = makeStyles(({ palette, spacing, breakpoints }) => ({
    container: {
        display: 'flex',
        height: 60,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0px ${spacing(4)}px`,
        background: palette.primary.main,
        [breakpoints.down('xs')]: {
            padding: `0px ${spacing(2)}px`,
        }
    },
    logoContainer: {
        display: 'flex',
        flex: 1,
        background: 'lavender',
    },
    logo: {
        height: 25,
        cursor: 'pointer'
    },
    navLinksContainer: {
        display: 'flex',
        flex: 1,
        justifyContent: 'flex-end'
    },
    navLink: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        textDecoration: 'none',
        transition: 'all 400ms linear',
        color: palette.text.secondary,
        '&:hover': {
            backgroundColor: palette.primary.dark
        }
    },
    navLinkText: {
        marginLeft: spacing(3),
        marginRight: spacing(3)
    }
}));

function Header(): React.ReactElement {
    const classes = useStyles();

    return (
        <Box className={classes.container}>
            <Link to={Routes.HOME}>
                <img className={classes.logo} src={PackratLogo} alt='packrat' />
            </Link>
            <Container className={classes.navLinksContainer}>
                <NavLink name='About' route={Routes.ABOUT} />
                <NavLink name='Login' route={Routes.LOGIN} />
            </Container>
        </Box>
    );
}

type NavLinkProps = {
    name: string;
    route: string;
};

function NavLink({ name, route }: NavLinkProps) {
    const classes = useStyles();

    return (
        <Link className={classes.navLink} to={route}>
            <Typography className={classes.navLinkText} color='inherit' variant='body1'>{name}</Typography>
        </Link>
    );
}

export default Header;
