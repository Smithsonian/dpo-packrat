/* eslint-disable react/jsx-max-props-per-line */

import { Box, Typography, Button } from '@material-ui/core';
import clsx from 'clsx';
import React from 'react';
import { EmptyTable } from '../../../../../components';
import { getDownloadObjectVersionUrlForObject } from '../../../../../utils/repository';
import { extractISOMonthDateYear, updateSystemObjectUploadRedirect } from '../../../../../constants/helperfunctions';
import { rollbackSystemObjectVersion, useObjectAssets } from '../../../hooks/useDetailsView';
import { useStyles } from './AssetDetailsTable';
import { PublishedStateEnumToString, eSystemObjectType } from '../../../../../types/server';
import GetAppIcon from '@material-ui/icons/GetApp';
import { SystemObjectVersion } from '../../../../../types/graphql';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router-dom';

interface ObjectVersionsTableProps {
    idSystemObject: number;
    objectVersions: SystemObjectVersion[];
    systemObjectType?: eSystemObjectType | undefined;
}

function ObjectVersionsTable(props: ObjectVersionsTableProps): React.ReactElement {
    const classes = useStyles();
    const { objectVersions, idSystemObject, systemObjectType } = props;
    const { REACT_APP_PACKRAT_SERVER_ENDPOINT } = process.env;
    const history = useHistory();

    const headers: string[] = ['Link', 'Published State', 'Action', 'Timestamp'];

    const { data } = useObjectAssets(idSystemObject);

    if (!objectVersions) {
        return <EmptyTable />;
    }

    const onRollback = async (idSystemObjectVersion: number) => {
        const confirm = window.confirm('Are you sure you wish to rollback?');
        if (!confirm) return;
        const { data } = await rollbackSystemObjectVersion(idSystemObjectVersion);
        if (data.rollbackSystemObjectVersion.success) {
            toast.success(`Successfully rolled back to to ${idSystemObjectVersion}!`);
        } else {
            toast.error(`Error when attempting to rollback to ${idSystemObjectVersion}. Reason: ${data.message}`);
        }
    };

    let redirect = () => {};
    if (data && data.getAssetDetailsForSystemObject?.assetDetails?.[0]) {
        const { idAsset, idAssetVersion, assetType } = data.getAssetDetailsForSystemObject?.assetDetails?.[0];
        redirect = () => {
            const newEndpoint = updateSystemObjectUploadRedirect(idAsset, idAssetVersion, systemObjectType, assetType);
            history.push(newEndpoint);
        };
    }

    return (
        <Box>
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
                    <tr>
                        <td colSpan={headers.length}>
                            {!objectVersions.length && (
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
            <Button className={classes.btn} variant='contained' color='primary' style={{ width: 'fit-content' }} onClick={redirect}>
                Add Version
            </Button>
        </Box>
    );
}

export default ObjectVersionsTable;
