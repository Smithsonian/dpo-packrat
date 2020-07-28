import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { INGESTION_ROUTES_TYPE } from '../../../constants';
import { Colors } from '../../../theme';
import { Link } from 'react-router-dom';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '0.8rem 1.25rem',
        width: 150,
        transition: 'all 250ms ease-in',
        textDecoration: 'none',
        overflow: 'hidden',
        borderRadius: 10,
        marginTop: 2,
        color: ({ isSelected }: SidebarMenuOptionProps) => isSelected ? palette.primary.main : palette.primary.dark,
        backgroundColor: ({ isSelected }: SidebarMenuOptionProps) => isSelected ? palette.primary.light : Colors.defaults.white,
        '&:hover': {
            cursor: 'pointer',
            color: palette.primary.main,
            backgroundColor: palette.primary.light
        },
    },
}));

export type SidebarRouteTypes = INGESTION_ROUTES_TYPE;

export interface SidebarMenuOptionProps {
    label: string;
    type: SidebarRouteTypes;
    isSelected: boolean;
}

function SidebarMenuOption(props: SidebarMenuOptionProps): React.ReactElement {
    const { label, type } = props;

    const classes = useStyles(props);

    return (
        <Link className={classes.container} to={type}>
            <Typography color='inherit' variant='body1'>{label}</Typography>
        </Link>
    );
}

export default SidebarMenuOption;