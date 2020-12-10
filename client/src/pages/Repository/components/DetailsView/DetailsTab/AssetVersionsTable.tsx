/**
 * AssetVersionsTable
 *
 * This component renders asset version table tab for the DetailsTab component.
 */
import { Box, Typography } from '@material-ui/core';
import clsx from 'clsx';
import React from 'react';
import { EmptyTable, NewTabLink } from '../../../../../components';
import { StateDetailVersion } from '../../../../../store';
import { getDetailsUrlForObject } from '../../../../../utils/repository';
import { formatBytes } from '../../../../../utils/upload';
import { useObjectVersions } from '../../../hooks/useDetailsView';
import { useStyles } from './AssetDetailsTable';

interface AssetVersionsTableProps {
    idSystemObject: number;
}

function AssetVersionsTable(props: AssetVersionsTableProps): React.ReactElement {
    const classes = useStyles();
    const { idSystemObject } = props;
    const { data, loading } = useObjectVersions(idSystemObject);

    const headers: string[] = [
        'Version',
        'Name',
        'Creator',
        'Date Created',
        'Size',
    ];

    if (!data || loading) {
        return <EmptyTable />;
    }

    const { versions } = data.getVersionsForSystemObject;

    return (
        <table className={classes.container}>
            <tr>
                {headers.map((header, index: number) => (
                    <th key={index} align='left'>
                        <Typography className={classes.header}>{header}</Typography>
                    </th>
                ))}
            </tr>
            {versions.map((version: StateDetailVersion, index: number) => (
                <tr key={index}>
                    <td>
                        <NewTabLink to={getDetailsUrlForObject(version.idSystemObject)}>
                            <Typography className={clsx(classes.value, classes.link)}>{version.version}</Typography>
                        </NewTabLink>
                    </td>
                    <td>
                        <NewTabLink to={getDetailsUrlForObject(version.idSystemObject)}>
                            <Typography className={clsx(classes.value, classes.link)}>{version.name}</Typography>
                        </NewTabLink>
                    </td>
                    <td align='left'>
                        <Typography className={classes.value}>{version.creator}</Typography>
                    </td>
                    <td>
                        <Typography className={classes.value}>{version.dateCreated}</Typography>
                    </td>
                    <td>
                        <Typography className={classes.value}>{formatBytes(version.size)}</Typography>
                    </td>
                </tr>
            ))}
            <td colSpan={5}>
                {!versions.length && (
                    <Box my={2}>
                        <Typography align='center' className={classes.value}>No versions found</Typography>
                    </Box>
                )}
            </td>
        </table>
    );
}

export default AssetVersionsTable;