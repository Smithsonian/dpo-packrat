/**
 * RepositoryIcon
 *
 * This component renders the icons for the repository tree view item.
 */
import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { eSystemObjectType } from '../../types/server';
import { getTermForSystemObjectType } from '../../utils/repository';

const useStyles = makeStyles(({ typography, breakpoints }) => ({
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 18,
        width: 18,
        borderRadius: 2.5,
        backgroundColor: ({ backgroundColor }: RepositoryIconProps) => backgroundColor,
        [breakpoints.down('lg')]: {
            height: 15,
            width: 15,
        },
    },
    initial: {
        fontSize: 10,
        fontWeight: typography.fontWeightMedium,
        color: ({ textColor }: RepositoryIconProps) => textColor,
    }
}));

interface RepositoryIconProps {
    objectType: eSystemObjectType;
    backgroundColor: string;
    textColor: string;
}

function RepositoryIcon(props: RepositoryIconProps): React.ReactElement {
    const { objectType } = props;
    const classes = useStyles(props);
    const initial = getTermForSystemObjectType(objectType).toUpperCase().slice(0, 1);

    return (
        <Box className={classes.container}>
            <Typography className={classes.initial}>{initial}</Typography>
        </Box>
    );
}

export default RepositoryIcon;