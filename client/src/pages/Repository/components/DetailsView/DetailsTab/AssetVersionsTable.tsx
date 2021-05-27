/**
 * AssetVersionsTable
 *
 * This component renders asset version table tab for the DetailsTab component.
 */
import { Box, Checkbox, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';
import { EmptyTable, NewTabLink } from '../../../../../components';
import { StateDetailVersion } from '../../../../../store';
import { getDetailsUrlForObject, getDownloadAssetVersionUrlForObject } from '../../../../../utils/repository';
import { formatDate } from '../../../../../utils/shared';
import { formatBytes } from '../../../../../utils/upload';
import { useObjectVersions } from '../../../hooks/useDetailsView';
import { useStyles } from './AssetDetailsTable';
import GetAppIcon from '@material-ui/icons/GetApp';

interface AssetVersionsTableProps {
    idSystemObject: number;
}

const CheckboxNoPadding = withStyles({
    root: {
        border: '0px',
        padding: '0px'
    }
})(Checkbox);

function AssetVersionsTable(props: AssetVersionsTableProps): React.ReactElement {
    const classes = useStyles();
    const { idSystemObject } = props;
    const { REACT_APP_PACKRAT_SERVER_ENDPOINT } = process.env;
    const { data, loading } = useObjectVersions(idSystemObject);

    const headers: string[] = ['Link', 'Version', 'Name', 'Creator', 'Date Created', 'Size', 'Ingested'];

    if (!data || loading) {
        return <EmptyTable />;
    }

    const { versions } = data.getVersionsForAsset;

    return (
        <table className={classes.container}>
            <thead>
                <tr>
                    {headers.map((header, index: number) => (
                        <th key={index} align='center'>
                            <Typography className={classes.header}>{header}</Typography>
                        </th>
                    ))}
                </tr>
                <tr>
                    <td colSpan={headers.length}>
                        <hr />
                    </td>
                </tr>
            </thead>

            <tbody>
                {versions.map((version: StateDetailVersion, index: number) => (
                    <tr key={index}>
                        <td>
                            <a
                                href={getDownloadAssetVersionUrlForObject(REACT_APP_PACKRAT_SERVER_ENDPOINT, version.idAssetVersion)}
                                style={{ textDecoration: 'none', color: 'black' }}
                            >
                                <GetAppIcon />
                            </a>
                        </td>
                        <td align='center'>
                            <NewTabLink to={getDetailsUrlForObject(version.idSystemObject)}>
                                <Typography className={clsx(classes.value, classes.link)}>{version.version}</Typography>
                            </NewTabLink>
                        </td>
                        <td align='center'>
                            <NewTabLink to={getDetailsUrlForObject(version.idSystemObject)}>
                                <Typography className={clsx(classes.value, classes.link)}>{version.name}</Typography>
                            </NewTabLink>
                        </td>
                        <td align='center'>
                            <Typography className={classes.value}>{version.creator}</Typography>
                        </td>
                        <td align='center'>
                            <Typography className={classes.value}>{formatDate(version.dateCreated)}</Typography>
                        </td>
                        <td align='center'>
                            <Typography className={classes.value}>{formatBytes(version.size)}</Typography>
                        </td>
                        <td align='center'>
                            <CheckboxNoPadding
                                disabled
                                checked={version.ingested ?? false}
                            />
                        </td>
                    </tr>
                ))}
                <tr>
                    <td colSpan={headers.length}>
                        {!versions.length && (
                            <Box my={2}>
                                <Typography align='center' className={classes.value}>
                                    No versions found
                                </Typography>
                            </Box>
                        )}
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

export default AssetVersionsTable;
