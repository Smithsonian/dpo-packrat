import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { Link } from 'react-router-dom';
import { Colors } from '../../../theme';
import LoadingButton from '../../controls/LoadingButton';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '40vw',
        padding: '20px 0px',
        marginLeft: 40,
        background: palette.background.paper
    },
    navButton: {
        minWidth: 100,
        color: Colors.defaults.white
    },
    link: {
        textDecoration: 'none'
    }
}));

interface SidebarBottomNavigatorProps {
    leftLabel: string;
    leftLoading?: boolean;
    leftRoute?: string;
    onClickLeft?: () => void;
    rightLabel: string;
    rightLoading?: boolean;
    rightRoute?: string;
    onClickRight?: () => void;
}

function SidebarBottomNavigator(props: SidebarBottomNavigatorProps): React.ReactElement {
    const { leftLabel, onClickLeft, leftRoute, leftLoading, rightLabel, onClickRight, rightRoute, rightLoading } = props;
    const classes = useStyles();

    let leftButton = (
        <LoadingButton
            className={classes.navButton}
            variant='contained'
            color='primary'
            disableElevation
            loading={leftLoading || false}
            onClick={onClickLeft}
        >
            {leftLabel}
        </LoadingButton>
    );

    let rightButton = (
        <LoadingButton
            className={classes.navButton}
            variant='contained'
            color='primary'
            disableElevation
            loading={rightLoading || false}
            onClick={onClickRight}
        >
            {rightLabel}
        </LoadingButton>
    );

    if (leftRoute) {
        leftButton = (
            <Link className={classes.link} to={leftRoute}>
                {leftButton}
            </Link>

        );
    }


    if (rightRoute) {
        rightButton = (
            <Link className={classes.link} to={rightRoute}>
                {rightButton}
            </Link>

        );
    }

    return (
        <Box className={classes.container}>
            {leftButton}
            {rightButton}
        </Box>
    );
}

export default SidebarBottomNavigator;