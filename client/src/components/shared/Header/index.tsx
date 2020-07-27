import React, { useContext } from 'react';
import { Box, Container, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import { Routes } from '../../../constants';
import { MdSecurity } from 'react-icons/md';
import { Colors } from '../../../theme';
import { IoIosSearch, IoIosNotifications, IoIosLogOut } from 'react-icons/io';
import { useHistory } from 'react-router-dom';
import API from '../../../api';
import { AppContext } from '../../../context';

const useStyles = makeStyles(({ palette, spacing, breakpoints }) => ({
    container: {
        display: 'flex',
        height: 60,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0px ${spacing(2)}px`,
        background: palette.primary.main,
        color: Colors.defaults.white,
        [breakpoints.down('xs')]: {
            padding: `0px ${spacing(2)}px`,
        }
    },
    logo: {
        cursor: 'pointer',
        paddingRight: spacing(2)
    },
    navOptionsContainer: {
        display: 'flex',
        flex: 1,
        justifyContent: 'flex-end'
    },
    navOption: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: spacing(1),
        transition: 'all 250ms ease-in',
        cursor: 'pointer'
    }
}));

function Header(): React.ReactElement {
    const { user, updateUser } = useContext(AppContext);
    const classes = useStyles();
    const history = useHistory();

    const onLogout = async () => {
        const { success } = await API.logout();

        if (success) {
            updateUser(null);
            history.push(Routes.LOGIN);
        }
    };

    return (
        <Box className={classes.container}>
            <Link className={classes.logo} to={Routes.HOME}>
                <MdSecurity size={30} color={Colors.defaults.white} />
            </Link>
            <Typography color='inherit' variant='body2'>{user?.Name || 'Jon Blundell'}</Typography>
            <Container className={classes.navOptionsContainer}>
                <NavOption>
                    <IoIosSearch size={25} color={Colors.defaults.white} />
                </NavOption>
                <NavOption>
                    <IoIosNotifications size={25} color={Colors.defaults.white} />
                </NavOption>
                <NavOption onClick={onLogout}>
                    <IoIosLogOut size={25} color={Colors.defaults.white} />
                </NavOption>
            </Container>
        </Box>
    );
}

type NavOptionProps = {
    children: React.ReactChild;
    onClick?: () => void;
};

function NavOption(props: NavOptionProps) {
    const { onClick, children } = props;
    const classes = useStyles();

    return (
        <Box className={classes.navOption} onClick={onClick}>
            {children}
        </Box>
    );
}

export default Header;
