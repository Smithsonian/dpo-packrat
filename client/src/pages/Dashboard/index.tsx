import React from 'react';
import { Box, Typography, Button, Icon } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom';
import { Routes } from '../../constants';

const useStyles = makeStyles(({ spacing }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutButton: {
        marginTop: spacing(5)
    }
}));

function Dashboard(): React.ReactElement {
    const classes = useStyles();
    const history = useHistory();

    const onLogout = async () => {
        const { success } = await fetch('http://localhost:4000/auth/logout', {
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        }).then(res => res.json());

        if (success) {
            history.push(Routes.LOGIN);
        }
    };

    return (
        <Box className={classes.container}>
            <Typography color='textPrimary' variant='h4'>Dashboard</Typography>
            <Button onClick={onLogout} className={classes.logoutButton} variant='outlined' color='primary' endIcon={<Icon>logout</Icon>}>
                Logout
            </Button>
        </Box>
    );
}

export default Dashboard;