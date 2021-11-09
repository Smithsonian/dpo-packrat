/**
 * IngestionSidebarMenuOption
 *
 * This component renders sidebar menu option for IngestionSidebarMenu component.
 */
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { memo } from 'react';
import { INGESTION_ROUTES_TYPE } from '../../../../constants';
import { Link } from 'react-router-dom';
// import { Colors } from '../../../../theme';

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
        // TODO: line 26 works but 27 doesn't. Why?
        color: 'black',
        // color: ({ isSelected }: IngestionSidebarMenuOptionProps) => (isSelected ? 'black' : 'black'),
        backgroundColor: ({ isSelected }: IngestionSidebarMenuOptionProps) => (isSelected ? palette.primary.light : palette.background.default),
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
    const { title, subtitle, enabled, route } = props;

    const classes = useStyles(props);

    const subContent: React.ReactNode = (
        <React.Fragment>
            <Typography color='inherit' variant='body1'>
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
