/* eslint-disable react/jsx-max-props-per-line */

/**
 * SidebarBottomNavigator
 *
 * This component renders bottom navigation view, used in data upload
 * and ingestion flow
 */
import { Box, TypographyProps } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { Link } from 'react-router-dom';
import { Colors } from '../../theme';
import LoadingButton from '../controls/LoadingButton';

const useStyles = makeStyles(({breakpoints }) => ({
    uploadContainer: {
        //display: 'flex', 
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px',
        //background: palette.background.paper
        background: 'rgb(236, 245, 253)' 
    },
    container: {
        //display: 'flex',
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '20px',
        //marginLeft: 20,
        //background: palette.background.paper
        //background: 'rgb(236, 245, 253)' 
    },
    navButton: {
        minHeight: 35,
        minWidth: 100,
        color: Colors.defaults.white,
        [breakpoints.down('lg')]: {
            height: 30
        },
        '&:focus': {
            outline: '2px solid #8DABC4'
        }
    },
    link: {
        textDecoration: 'none'
    },
}));

interface SidebarBottomNavigatorProps {
    btnProps?: TypographyProps;
    leftLabel: string;
    leftLoading?: boolean;
    leftRoute?: string;
    uploadVersion?: boolean;
    onClickLeft?: (e: React.MouseEvent<HTMLElement>) => void;
    rightLabel: string;
    rightLoading?: boolean;
    rightRoute?: string;
    onClickRight?: (e: React.MouseEvent<HTMLElement>) => void;
    invalidMetadataStep?: boolean;
    disableNavigation?: boolean;
}

function SidebarBottomNavigator(props: SidebarBottomNavigatorProps): React.ReactElement {
    const { leftLabel, onClickLeft, leftRoute, leftLoading, rightLabel, onClickRight, rightRoute, rightLoading, uploadVersion, invalidMetadataStep, disableNavigation } = props;
    const classes = useStyles();
    // console.log(`SidebarBottomNavigator ${JSON.stringify(props)}, onClickRight ${onClickRight ? 'defined' : 'NOT defined'}`);

    let leftButton = (
        <LoadingButton className={classes.navButton} style={{marginRight: '30px'}} disableElevation loaderSize={15} loading={leftLoading || false} disabled={disableNavigation} onClick={onClickLeft}>
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
            <Link className={classes.link} to={leftRoute} onClick={onClickLeft}>
                {leftButton}
            </Link>
        );
    }

    if (rightRoute) {
        rightButton = (
            <Link className={classes.link} to={rightRoute} onClick={onClickRight}>
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
