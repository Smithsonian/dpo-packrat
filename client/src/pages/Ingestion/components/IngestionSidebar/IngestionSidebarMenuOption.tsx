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
        padding: '0.8rem 1.25rem',
        width: 150,
        transition: 'all 250ms ease-in',
        textDecoration: 'none',
        overflow: 'hidden',
        borderRadius: 10,
        marginTop: 2,
        color: ({ isSelected }: IngestionSidebarMenuOptionProps) => isSelected ? palette.primary.main : palette.primary.dark,
        backgroundColor: ({ isSelected }: IngestionSidebarMenuOptionProps) => isSelected ? palette.primary.light : Colors.defaults.white,
        '&:hover': {
            cursor: ({ enabled }: IngestionSidebarMenuOptionProps) => enabled ? 'pointer' : undefined,
            color: ({ enabled }: IngestionSidebarMenuOptionProps) => enabled ? palette.primary.main : undefined,
            backgroundColor: ({ enabled }: IngestionSidebarMenuOptionProps) => enabled ? palette.primary.light : undefined
        },
    },
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

    const content = (
        <>
            <Typography color='inherit' variant='body1'>{title}</Typography>
            <Typography color='textSecondary' variant='caption'>{subtitle}</Typography>
        </>
    );

    return (
        <>
            {enabled ?
                <Link className={classes.container} to={route}>
                    {content}
                </Link> :
                <Box className={classes.container}>
                    {content}
                </Box>
            }
        </>
    );
}

export default memo(IngestionSidebarMenuOption);