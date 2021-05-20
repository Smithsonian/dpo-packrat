import { Box, Typography } from '@material-ui/core';
import clsx from 'clsx';
import React from 'react';
import { EmptyTable } from '../../../../../components';
import { getDownloadObjectVersionUrlForObject /*, getDetailsUrlForObject */ } from '../../../../../utils/repository';
import { extractISOMonthDateYear } from '../../../../../constants/helperfunctions';
import { rollbackSystemObjectVersion } from '../../../hooks/useDetailsView';
import { useStyles } from './AssetDetailsTable';
import { PublishedStateEnumToString } from '../../../../../store/vocabulary';
import GetAppIcon from '@material-ui/icons/GetApp';
import { SystemObjectVersion } from '../../../../../types/graphql';
import { toast } from 'react-toastify';

interface ObjectVersionsTableProps {
    idSystemObject: number;
    objectVersions: SystemObjectVersion[];
}

function ObjectVersionsTable(props: ObjectVersionsTableProps): React.ReactElement {
    const classes = useStyles();
    const { objectVersions } = props;
    const { REACT_APP_PACKRAT_SERVER_ENDPOINT } = process.env;
    console.log('objectVersions', objectVersions);
    const headers: string[] = ['Link', 'Published State', 'Action', 'Timestamp'];

    if (!objectVersions) {
        return <EmptyTable />;
    }

    const onRollback = async (idSystemObjectVersion: number) => {
        const confirm = window.confirm('Are you sure you wish to rollback?');
        if (!confirm) return;
        // pass the id into rollback mutation
        const { data } = await rollbackSystemObjectVersion(idSystemObjectVersion);
        if (data.rollbackSystemObjectVersion.success) {
            toast.success(`Successfully rolled back to to ${idSystemObjectVersion}!`);
        } else {
            toast.error(`Error when attempting to rollback to ${idSystemObjectVersion}. Reason: ${data.message}`);
        }
    };

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
                {objectVersions.map((version, index) => (
                    <tr key={index}>
                        <td align='center'>
                            <a
                                href={getDownloadObjectVersionUrlForObject(REACT_APP_PACKRAT_SERVER_ENDPOINT, version.idSystemObjectVersion)}
                                style={{ textDecoration: 'none', color: 'black' }}
                            >
                                <GetAppIcon />
                            </a>
                        </td>
                        <td align='center'>
                            <Typography className={clsx(classes.value)}>{PublishedStateEnumToString(version.PublishedState)}</Typography>
                        </td>
                        <td align='center'>
                            {index >= objectVersions.length - 1 ? null : (
                                <Typography
                                    style={{ width: 'fit-content', whiteSpace: 'nowrap', color: 'rgb(0,121,196)', cursor: 'pointer' }}
                                    onClick={() => onRollback(version.idSystemObjectVersion)}
                                    // disabled={index >= objectVersions.length - 1}
                                >
                                    Rollback
                                </Typography>
                            )}
                        </td>
                        <td align='center'>
                            <Typography>{extractISOMonthDateYear(version.DateCreated)}</Typography>
                        </td>
                    </tr>
                ))}
            </tbody>

            <tfoot>
                <td colSpan={headers.length}>
                    {!objectVersions.length && (
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
