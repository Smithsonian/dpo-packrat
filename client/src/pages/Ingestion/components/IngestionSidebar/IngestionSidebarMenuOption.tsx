/**
 * IngestionSidebarMenuOption
 *
 * This component renders sidebar menu option for IngestionSidebarMenu component.
 */
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { memo } from 'react';
import { INGESTION_ROUTES_TYPE } from '../../../../constants';
import { Colors } from '../../../../theme';
import { Link } from 'react-router-dom';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '0.8rem',
        width: 150,
        transition: 'all 250ms ease-in',
        textDecoration: 'none',
        overflow: 'hidden',
        borderRadius: 5,
        marginTop: 2,
        backgroundColor: ({ isSelected }: IngestionSidebarMenuOptionProps) => (isSelected ? palette.primary.light : Colors.defaults.white),
        '&:hover': {
            cursor: ({ enabled }: IngestionSidebarMenuOptionProps) => (enabled ? 'pointer' : undefined),
            color: ({ enabled }: IngestionSidebarMenuOptionProps) => (enabled ? palette.primary.main : undefined),
            backgroundColor: ({ enabled }: IngestionSidebarMenuOptionProps) => (enabled ? palette.primary.light : undefined)
        }
    }
}));

export type SidebarRouteTypes = INGESTION_ROUTES_TYPE | string;

export interface IngestionSidebarMenuOptionProps {
    title: string;
    subtitle?: string;
    enabled: boolean;
    route: SidebarRouteTypes;
    isSelected: boolean;
}

function IngestionSidebarMenuOption(props: IngestionSidebarMenuOptionProps): React.ReactElement {
    const { title, subtitle, enabled, route, isSelected } = props;

    const classes = useStyles(props);

    const subContent: React.ReactNode = (
        <React.Fragment>
            <Typography style={{ color: isSelected ? '#0079C4' : '#2C405A' }} variant='body1'>
                {title}
            </Typography>
            <Typography color='textSecondary' variant='caption'>
                {subtitle}
            </Typography>
        </React.Fragment>
    );

    let content = <Box className={classes.container}>{subContent}</Box>;

    if (enabled) {
        content = (
            <Link className={classes.container} to={route}>
                {subContent}
            </Link>
        );
    }

    return <React.Fragment>{content}</React.Fragment>;
}

export default memo(IngestionSidebarMenuOption);
