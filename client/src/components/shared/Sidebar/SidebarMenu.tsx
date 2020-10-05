import { Box, Grid, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import SidebarMenuOption, { SidebarRouteTypes } from './SidebarMenuOption';

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        padding: '2em 1em',
        borderRight: `1px solid ${palette.primary.light}`
    },
    menuLabel: {
        color: palette.primary.contrastText,
        fontWeight: typography.fontWeightMedium,
        marginLeft: spacing(2),
        marginBottom: spacing(5)
    },
    menuOptions: {
        display: 'flex',
        flex: 1
    }
}));

export type SidebarOption = {
    label: string;
    type: SidebarRouteTypes
};

interface SidebarMenuProps {
    title: string;
    paramIdentifier: string;
    initialRoute?: SidebarRouteTypes;
    options: SidebarOption[];
    children: React.ReactNode;
}

export function SidebarMenu(props: SidebarMenuProps): React.ReactElement {
    const { title, children, initialRoute, options, paramIdentifier } = props;
    const param = useParams()[paramIdentifier];
    const [selectedOption, setSelectedOption] = useState(initialRoute || param);

    const classes = useStyles();

    useEffect(() => {
        setSelectedOption(param);
    }, [param]);

    const sidebarOptions = options.map(option => ({
        ...option,
        isSelected: selectedOption === option.type
    }));

    return (
        <React.Fragment>
            <Box className={classes.container}>
                <Typography className={classes.menuLabel} variant='caption'>{title}</Typography>
                <Grid container className={classes.menuOptions} direction='column'>
                    {sidebarOptions.map((props, index) => <SidebarMenuOption key={index} {...props} />)}
                </Grid>
            </Box>
            {children}
        </React.Fragment>
    );
}
