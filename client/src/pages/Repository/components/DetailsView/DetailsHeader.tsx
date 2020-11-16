/**
 * DetailsHeader
 *
 * This component renders repository details header for the DetailsView component.
 */
import { Box, Checkbox, FormControlLabel, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { BreadcrumbsView } from '../../../../components';
import Colors from '../../../../theme/colors';
import { eSystemObjectType } from '../../../../types/server';
import { RepositoryPath } from '../../../../types/graphql';
import { getTermForSystemObjectType } from '../../../../utils/repository';

const useStyles = makeStyles(({ palette }) => ({
    header: {
        color: palette.primary.dark
    },
    name: {
        width: 180,
        padding: '5px 8px',
        borderRadius: 5,
        marginRight: 20,
        color: palette.primary.dark,
        backgroundColor: Colors.defaults.white,
        border: `0.5px solid ${palette.primary.contrastText}`,
        fontSize: '0.8em'
    },
    checkboxLabel: {
        color: palette.primary.dark
    }
}));

interface DetailsHeaderProps {
    objectType: eSystemObjectType;
    path: RepositoryPath[][];
    name: string;
    retired: boolean;
    disabled: boolean;
}

function DetailsHeader(props: DetailsHeaderProps): React.ReactElement {
    const { objectType, path, name, retired, disabled } = props;
    const classes = useStyles();

    return (
        <Box display='flex' flexDirection='column' justifyContent='center' mb={1}>
            <Box display='flex'>
                <Box display='flex' flex={1}>
                    <Typography className={classes.header} variant='h5'>{getTermForSystemObjectType(objectType)}</Typography>
                </Box>
                <Box display='flex' flex={3} justifyContent='flex-end'>
                    {!!path.length && <BreadcrumbsView highlighted items={path} />}
                </Box>
            </Box>
            <Box display='flex' alignItems='center' mt={1}>
                <Box className={classes.name}>
                    <Typography variant='body1'>{name}</Typography>
                </Box>
                <FormControlLabel
                    className={classes.checkboxLabel}
                    labelPlacement='start'
                    label='Retired'
                    control={<Checkbox disabled={disabled} checked={retired} name='retired' color='primary' />}
                />
            </Box>
        </Box>
    );
}

export default DetailsHeader;