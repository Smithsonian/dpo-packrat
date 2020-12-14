/**
 * DetailsHeader
 *
 * This component renders repository details header for the DetailsView component.
 */
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { Helmet } from 'react-helmet';
import { BreadcrumbsView } from '../../../../components';
import Colors from '../../../../theme/colors';
import { RepositoryPath } from '../../../../types/graphql';
import { eSystemObjectType } from '../../../../types/server';
import { getTermForSystemObjectType } from '../../../../utils/repository';
import { getHeaderTitle } from '../../../../utils/shared';

const useStyles = makeStyles(({ palette }) => ({
    header: {
        color: palette.primary.dark
    },
    name: {
        minWidth: 180,
        height: 20,
        padding: '5px 8px',
        borderRadius: 5,
        marginRight: 20,
        color: palette.primary.dark,
        backgroundColor: Colors.defaults.white,
        border: `0.5px solid ${palette.primary.contrastText}`,
        fontSize: '0.8em'
    }
}));

interface DetailsHeaderProps {
    objectType: eSystemObjectType;
    path: RepositoryPath[][];
    name: string;
}

function DetailsHeader(props: DetailsHeaderProps): React.ReactElement {
    const { objectType, path, name } = props;
    const classes = useStyles();

    const title = getHeaderTitle(`${name} ${getTermForSystemObjectType(objectType)}`);

    return (
        <Box display='flex' flexDirection='row' justifyContent='center' mb={1}>
            <Helmet>
                <title>{title}</title>
            </Helmet>
            <Box display='flex' mr={4}>
                <Typography className={classes.header} variant='h5'>{getTermForSystemObjectType(objectType)}</Typography>
            </Box>
            <Box className={classes.name} mr={4}>
                <Typography>{name}</Typography>
            </Box>
            <Box display='flex' flex={1} justifyContent='flex-end'>
                {!!path.length && <BreadcrumbsView highlighted items={path} />}
            </Box>
        </Box>
    );
}

export default DetailsHeader;