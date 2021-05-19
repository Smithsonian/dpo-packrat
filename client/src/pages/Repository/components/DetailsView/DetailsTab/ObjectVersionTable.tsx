import { Box, Typography } from '@material-ui/core';
import clsx from 'clsx';
import React from 'react';
import { EmptyTable, NewTabLink } from '../../../../../components';
import { getDownloadObjectVersionForObject, getDetailsUrlForObject } from '../../../../../utils/repository';
import { useSystemObjectVersionFromSystemObject } from '../../../hooks/useDetailsView';
import { useStyles } from './AssetDetailsTable';
import { PublishedStateEnumToString } from '../../../../../store/vocabulary';
import GetAppIcon from '@material-ui/icons/GetApp';

interface ObjectVersionsTableProps {
    idSystemObject: number;
}

function ObjectVersionsTable(props: ObjectVersionsTableProps): React.ReactElement {
    const classes = useStyles();
    const { idSystemObject } = props;
    const { REACT_APP_PACKRAT_SERVER_ENDPOINT } = process.env;
    const { data, loading } = useSystemObjectVersionFromSystemObject(idSystemObject);

    const headers: string[] = ['Link', 'Published State', 'Action', 'Timestamp'];

    if (!data || loading) {
        return <EmptyTable />;
    }

    const { systemObjectVersions } = data.getSystemObjectVersionFromSystemObject;

    const onRollback = (idSystemObjectVersion: number) => {
        console.log(idSystemObjectVersion);
        // pass the id into rollback mutation
    };

    return (
        <table className={classes.container}>
            <thead>
                <tr>
                    {headers.map((header, index: number) => (
                        <th key={index} align='left'>
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
                {systemObjectVersions.map((version, index) => (
                    <tr key={index}>
                        <td>
                            <a
                                href={getDownloadObjectVersionForObject(REACT_APP_PACKRAT_SERVER_ENDPOINT, version.idSystemObjectVersion)}
                                style={{ textDecoration: 'none', color: 'black' }}
                            >
                                <GetAppIcon />
                            </a>
                        </td>
                        <td>
                            <Typography className={clsx(classes.value)}>{PublishedStateEnumToString(version.PublishedState)}</Typography>
                        </td>
                        <td>
                            <NewTabLink to={getDetailsUrlForObject(version.idSystemObject)}>
                                <Typography className={clsx(classes.value, classes.link)}>{version.idSystemObjectVersion}</Typography>
                            </NewTabLink>
                        </td>
                        <td>{index < systemObjectVersions.length - 1 && <Typography onClick={() => onRollback(version.idSystemObjectVersion)}>Rollback</Typography>}</td>
                        <td>
                            <Typography>Date</Typography>
                        </td>
                    </tr>
                ))}
            </tbody>

            <tfoot>
                <td colSpan={headers.length}>
                    {!systemObjectVersions.length && (
                        <Box my={2}>
                            <Typography align='center' className={classes.value}>
                                No versions found
                            </Typography>
                        </Box>
                    )}
                </td>
            </tfoot>
        </table>
    );
}

export default ObjectVersionsTable;
