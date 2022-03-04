/* eslint-disable react/jsx-max-props-per-line */

import { Box, Typography, Button, Tooltip } from '@material-ui/core';
import clsx from 'clsx';
import React, { useState } from 'react';
import { EmptyTable, TextArea, ToolTip } from '../../../../../components';
import { getDownloadObjectVersionUrlForObject } from '../../../../../utils/repository';
import { updateSystemObjectUploadRedirect, truncateWithEllipses } from '../../../../../constants/helperfunctions';
import { rollbackSystemObjectVersion, useObjectAssets } from '../../../hooks/useDetailsView';
import { useStyles } from './AssetGrid';
import { PublishedStateEnumToString, eSystemObjectType } from '@dpo-packrat/common';
import GetAppIcon from '@material-ui/icons/GetApp';
import { SystemObjectVersion } from '../../../../../types/graphql';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router-dom';
import { MdExpandMore, MdExpandLess } from 'react-icons/md';
import API from '../../../../../api';
import { formatDateAndTime } from '../../../../../utils/shared';

interface ObjectVersionsTableProps {
    idSystemObject: number;
    objectVersions: SystemObjectVersion[];
    systemObjectType?: eSystemObjectType | undefined;
}

interface headerColumn {
    name: string;
    width?: number | string;
    flex?: string;
}

function ObjectVersionsTable(props: ObjectVersionsTableProps): React.ReactElement {
    const classes = useStyles();
    const { objectVersions, idSystemObject, systemObjectType } = props;
    const serverEndpoint = API.serverEndpoint();
    const history = useHistory();
    const [expanded, setExpanded] = useState<number>(-1);
    const [rollbackNotes, setRollbackNotes] = useState<string>('');
    const headers: headerColumn[] = [
        {
            name: 'Link',
            width: '30px',
        }, {
            name: 'Date',
            width: '140px',
        }, {
            name: 'Published State',
            width: '110px',
        }, {
            name: 'Action',
            width: '70px',
        }, {
            name: 'Notes',
            flex: '1'
        }
    ];


    const { data } = useObjectAssets(idSystemObject);
    if (!objectVersions)
        return <EmptyTable />;

    const onRollback = async (idSystemObjectVersion: number, time: string) => {
        if (rollbackNotes.length < 1) {
            toast.error('Please provide rollback notes');
            return;
        }
        const { data } = await rollbackSystemObjectVersion(idSystemObjectVersion, rollbackNotes, formatDateAndTime(time));
        if (data.rollbackSystemObjectVersion.success) {
            toast.success(`Successfully rolled back to to ${idSystemObjectVersion}!`);
            setRollbackNotes('');
            setExpanded(-1);
            window.location.reload();
        } else {
            toast.error(`Error when attempting to rollback to ${idSystemObjectVersion}. Reason: ${data.message}`);
        }
    };

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
        setExpanded(row === expanded ? -1 : row);
    };

    return (
        <Box style={{ minWidth: '620px' }}>
            <table className={clsx(classes.container, classes.fixedTable)}>
                <thead>
                    <tr style={{ borderBottom: '1px solid grey' }}>
                        {headers.map(({ name, width, flex }, index: number) => (
                            <th key={index} align='center' style={{ width, padding: 5, flex }}>
                                <Typography className={classes.header}>{name}</Typography>
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {objectVersions.map((version, index) =>  {
                        const rollback = () => onRollback(version.idSystemObjectVersion, version.DateCreated);
                        const cancel = () => onExpand(index);
                        const comment =
                            version.Comment ? (
                                <Tooltip arrow title={ <ToolTip text={truncateWithEllipses(version.Comment, 1000)} /> } placement='left'>
                                    {version.CommentLink ? <a href={version.CommentLink} style={{ color: 'black' }} target='_blank' rel='noreferrer noopener'>
                                        <Typography className={clsx(classes.value)} style={{ display: 'initial' }}>
                                            {truncateWithEllipses(version.Comment, 1000)}
                                        </Typography>
                                    </a> : <Typography className={clsx(classes.value)} style={{ display: 'initial' }}>
                                        {truncateWithEllipses(version.Comment, 1000)}
                                    </Typography>}
                                </Tooltip>
                            ) : null;

                        return (
                            <React.Fragment key={index}>
                                <tr key={index}>
                                    <td align='center' style={{ padding: 0 }}>
                                        <a
                                            href={getDownloadObjectVersionUrlForObject(serverEndpoint, version.idSystemObjectVersion)}
                                            className={classes.downloadIconLink}
                                        >
                                            <GetAppIcon />
                                        </a>
                                    </td>
                                    <td align='center' style={{ padding: 0 }}>
                                        <Typography className={clsx(classes.value)}>{formatDateAndTime(version.DateCreated)}</Typography>
                                    </td>
                                    <td align='center' style={{ padding: 0 }}>
                                        <Typography className={clsx(classes.value)}>{PublishedStateEnumToString(version.PublishedState)}</Typography>
                                    </td>
                                    <td align='center' style={{ padding: 0 }}>
                                        {index >= objectVersions.length - 1 ? null : (
                                            <Typography
                                                onClick={() => onExpand(index)}
                                                className={clsx(classes.value, classes.rollbackText)}
                                            >
                                                Rollback
                                                {expanded === index ? <MdExpandLess /> : <MdExpandMore />}
                                            </Typography>
                                        )}
                                    </td>
                                    <td className={classes.ellipsisCell} style={{ padding: '0px 5px 0px 0px' }}>
                                        {comment}
                                    </td>
                                </tr>
                                {
                                    expanded === index ? (
                                        <tr>
                                            <td align='center' colSpan={5}>
                                                <Box className={classes.rollbackContainer}>
                                                    <TextArea value={rollbackNotes} name='rollbackNotes' onChange={(e) => setRollbackNotes(e.target.value)} placeholder='Please provide rollback notes...' rows='4' />
                                                    <Box style={{ columnGap: '3px', display: 'flex' }}>
                                                        <Button onClick={rollback} className={classes.btn} style={{ padding: 2.5 }} variant='contained' disableElevation color='primary'>Rollback</Button>
                                                        <Button onClick={cancel} className={classes.btn} style={{ padding: 0 }} variant='contained' disableElevation color='primary'>Cancel</Button>
                                                    </Box>
                                                </Box>
                                            </td>
                                        </tr>
                                    ) : null
                                }
                            </React.Fragment>
                        );
                    })}
                    {!objectVersions.length && (
                        <tr>
                            <td colSpan={headers.length}>
                                <Box my={2}>
                                    <Typography align='center' className={classes.value}>
                                        No versions found
                                    </Typography>
                                </Box>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            <Button className={classes.btn} variant='contained' disableElevation color='primary' style={{ width: 'fit-content' }} onClick={redirect}>
                Add Version
            </Button>
        </Box>
    );
}

export default ObjectVersionsTable;
