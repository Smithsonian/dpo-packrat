/* eslint-disable react/jsx-max-props-per-line */

import { Box, Typography, Button } from '@material-ui/core';
import clsx from 'clsx';
import React, { useState }from 'react';
import { EmptyTable, TextArea } from '../../../../../components';
import { getDownloadObjectVersionUrlForObject } from '../../../../../utils/repository';
import { extractISOMonthDateYear, updateSystemObjectUploadRedirect } from '../../../../../constants/helperfunctions';
import { rollbackSystemObjectVersion, useObjectAssets } from '../../../hooks/useDetailsView';
import { useStyles } from './AssetGrid';
import { PublishedStateEnumToString, eSystemObjectType } from '../../../../../types/server';
import GetAppIcon from '@material-ui/icons/GetApp';
import { SystemObjectVersion } from '../../../../../types/graphql';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router-dom';
import { MdExpandMore, MdExpandLess } from 'react-icons/md';

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
    const [expanded, setExpanded] = useState<number>(-1);
    const [rollbackNotes, setRollbackNotes] = useState<string>('');

    const headers: string[] = ['Link', 'Published State', 'Action', 'Timestamp'];

    const { data } = useObjectAssets(idSystemObject);

    if (!objectVersions) {
        return <EmptyTable />;
    }

    const onRollback = async (idSystemObjectVersion: number) => {
        const { data } = await rollbackSystemObjectVersion(idSystemObjectVersion);
        if (data.rollbackSystemObjectVersion.success) {
            toast.success(`Successfully rolled back to to ${idSystemObjectVersion}!`);
        } else {
            toast.error(`Error when attempting to rollback to ${idSystemObjectVersion}. Reason: ${data.message}`);
        }
    };

    console.log('onRollback', onRollback);
    /*
        TODO:
            -Connect rollback button to onRollback
            -Add the rollbackNotes to the mutation
                -modify the mutation
            -End of rollback procedure?
                -close rollback
                -erase notes
            -Add Notes column
                -notes has a truncated message, on hover, and acts as a link
    */

    let redirect = () => {};
    if (data && data.getAssetDetailsForSystemObject?.assetDetailRows?.[0]) {
        const { idAsset, idAssetVersion, assetType } = data.getAssetDetailsForSystemObject?.assetDetailRows?.[0];
        redirect = () => {
            const newEndpoint = updateSystemObjectUploadRedirect(idAsset, idAssetVersion, systemObjectType, assetType);
            history.push(newEndpoint);
        };
    }

    const onExpand = (row) => {
        setRollbackNotes('');

        if (row === expanded) {
            setExpanded(-1);
        } else {
            setExpanded(row);
        }
    };

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
                    {objectVersions.map((version, index) =>  {
                        return (
                            <>
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
                                                onClick={() => onExpand(index)}
                                            >
                                                Rollback
                                                {expanded === index ? <MdExpandLess /> : <MdExpandMore />}
                                            </Typography>
                                        )}
                                    </td>
                                    <td align='center'>
                                        <Typography>{extractISOMonthDateYear(version.DateCreated)}</Typography>
                                    </td>
                                </tr>
                                {
                                    expanded === index ? (
                                        <tr>
                                            <td colSpan={3}>
                                                <TextArea value={rollbackNotes} name='rollbackNotes' onChange={(e) => setRollbackNotes(e.target.value)} height='5vh' placeholder='Please provide rollback notes...' />
                                            </td>
                                            <td>
                                                <Button>Rollback</Button>
                                                <Button onClick={() => onExpand(index)}>Cancel</Button>
                                            </td>
                                        </tr>
                                    ) : null
                                }
                            </>
                        );
                    })}
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
