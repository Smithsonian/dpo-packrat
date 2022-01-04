/**
 * IngestionSidebarMenu
 *
 * This component renders sidebar menu for Ingestion flow.
 */
import { Box, Grid, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useState, useEffect } from 'react';
import IngestionSidebarMenuOption, { SidebarRouteTypes } from './IngestionSidebarMenuOption';
import { INGESTION_ROUTE } from '../../../../constants';

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        padding: '2em 1em',
        borderRight: `1px solid ${palette.primary.light}`,
        backgroundColor: palette.background.default
    },
    menuLabel: {
        color: palette.primary.dark,
        fontWeight: typography.fontWeightMedium,
        marginLeft: spacing(2),
        marginBottom: spacing(2)
    },
    menuOptions: {
        display: 'flex',
        flex: 1
    },
    divider: {
        height: 1,
        width: '100%',
        marginTop: spacing(2),
        marginBottom: spacing(3),
        background: palette.grey[400]
    }
}));

export type IngestionSidebarOption = {
    title: string;
    subtitle?: string;
    enabled: boolean;
    route: SidebarRouteTypes;
};

interface IngestionSidebarMenuProps {
    title: string;
    paramIdentifier: string;
    initialRoute?: SidebarRouteTypes;
    options: IngestionSidebarOption[];
    children?: React.ReactNode;
}

export function IngestionSidebarMenu(props: IngestionSidebarMenuProps): React.ReactElement {
    const { title, children, initialRoute, options } = props;

    const fullRoute = decodeURIComponent(window.location.href);

    const [selectedOption, setSelectedOption] = useState(initialRoute || fullRoute);
    const classes = useStyles();

    useEffect(() => {
        setSelectedOption(decodeURIComponent(fullRoute));
    }, [fullRoute]);

    const sidebarOptions = options.map(option => ({
        ...option,
        isSelected: selectedOption.includes(option.route)
    }));

    return (
        <React.Fragment>
            <Box className={classes.container}>
                <Typography className={classes.menuLabel} variant='caption'>{title}</Typography>
                <IngestionSidebarMenuOption
                    title='Uploads'
                    enabled
                    route={INGESTION_ROUTE.ROUTES.UPLOADS}
                    isSelected={selectedOption.includes(INGESTION_ROUTE.ROUTES.UPLOADS)}
                />
                <Box className={classes.divider} />
                <Grid container className={classes.menuOptions} direction='column'>
                    {sidebarOptions.map((props, index) => <IngestionSidebarMenuOption key={index} {...props} />)}
                </Grid>
            </Box>
            {children}
        </React.Fragment>
    );
}
