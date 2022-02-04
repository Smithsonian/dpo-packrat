/* eslint-disable react/jsx-max-props-per-line */

/**
 * DetailsHeader
 *
 * This component renders repository details header for the DetailsView component.
 */
import { Box, Typography } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { Helmet } from 'react-helmet';
import { BreadcrumbsView } from '../../../../components';
import { GetSystemObjectDetailsResult, RepositoryPath } from '../../../../types/graphql';
import { eSystemObjectType } from '@dpo-packrat/common';
import { getTermForSystemObjectType, isFieldUpdated } from '../../../../utils/repository';

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
        border: (updated: boolean) => `1px solid ${fade(updated ? palette.secondary.main : palette.primary.contrastText, 0.4)}`,
        backgroundColor: (updated: boolean) => (updated ? palette.secondary.light : palette.background.paper),
        fontSize: '0.8em'
    }
}));

interface DetailsHeaderProps {
    originalFields: GetSystemObjectDetailsResult;
    objectType: eSystemObjectType;
    path: RepositoryPath[][];
    name?: string | null;
    disabled: boolean;
    onNameUpdate: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function DetailsHeader(props: DetailsHeaderProps): React.ReactElement {
    const { objectType, path, name, onNameUpdate, disabled, originalFields } = props;
    const updated: boolean = isFieldUpdated({ name }, originalFields, 'name');

    const classes = useStyles(updated);
    const title = `${getTermForSystemObjectType(objectType)} ${name}`;

    return (
        <Box display='flex' flexDirection='row' justifyContent='center' mb={1}>
            <Helmet>
                <title>{title}</title>
            </Helmet>
            <Box display='flex' mr={4}>
                <Typography className={classes.header} variant='h5'>
                    {getTermForSystemObjectType(objectType)}
                </Typography>
            </Box>
            <Box mr={4}>
                <DebounceInput title='object name' element='input' disabled={disabled} value={name || ''} className={classes.name} name='name' onChange={onNameUpdate} debounceTimeout={400} />
            </Box>
            <Box display='flex' flex={1} justifyContent='flex-end'>
                {!!path.length && <BreadcrumbsView highlighted items={path} />}
            </Box>
        </Box>
    );
}

export default DetailsHeader;
