/* eslint-disable react/jsx-max-props-per-line */

/**
 * SidebarBottomNavigator
 *
 * This component renders bottom navigation view, used in data upload
 * and ingestion flow
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { Link } from 'react-router-dom';
import { Colors } from '../../theme';
import LoadingButton from '../controls/LoadingButton';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    uploadContainer: {
        display: 'flex',
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0px',
        background: palette.background.paper
    },
    container: {
        display: 'flex',
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '53vw',
        padding: '20px 0px',
        marginLeft: 20,
        background: palette.background.paper
    },
    navButton: {
        minHeight: 35,
        minWidth: 100,
        color: Colors.defaults.white,
        [breakpoints.down('lg')]: {
            height: 30
        }
    },
    link: {
        textDecoration: 'none'
    }
}));

interface SidebarBottomNavigatorProps {
    leftLabel: string;
    leftLoading?: boolean;
    leftRoute?: string;
    uploadVersion?: boolean;
    onClickLeft?: () => void;
    rightLabel: string;
    rightLoading?: boolean;
    rightRoute?: string;
    onClickRight?: () => void;
    invalidMetadataStep?: boolean;
    disableNavigation?: boolean;
}

function SidebarBottomNavigator(props: SidebarBottomNavigatorProps): React.ReactElement {
    const { leftLabel, onClickLeft, leftRoute, leftLoading, rightLabel, onClickRight, rightRoute, rightLoading, uploadVersion, invalidMetadataStep, disableNavigation } = props;
    const classes = useStyles();

    let leftButton = (
        <LoadingButton className={classes.navButton} disableElevation loaderSize={15} loading={leftLoading || false} disabled={disableNavigation} onClick={onClickLeft}>
            {leftLabel}
        </LoadingButton>
    );

    let rightButton = (
        <LoadingButton className={classes.navButton} disableElevation loaderSize={15} loading={rightLoading || false} disabled={disableNavigation} onClick={onClickRight}>
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

    if (invalidMetadataStep) {
        rightButton = (
            <LoadingButton className={classes.navButton} disableElevation loaderSize={15} loading={rightLoading || false} onClick={onClickRight} disabled>
                {rightLabel}
            </LoadingButton>
        );
    }

    const containerType = uploadVersion ? classes.uploadContainer : classes.container;

    return (
        <Box className={containerType}>
            {leftButton}
            {rightButton}
        </Box>
    );
}

export default SidebarBottomNavigator;
