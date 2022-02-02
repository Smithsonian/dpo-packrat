/* eslint-disable react/jsx-max-props-per-line */

import { Box, Typography, Button, Tooltip } from '@material-ui/core';
import clsx from 'clsx';
import React, { useState } from 'react';
import { EmptyTable, TextArea, ToolTip } from '../../../../../components';
import { getDownloadObjectVersionUrlForObject } from '../../../../../utils/repository';
import { extractISOMonthDateYear, updateSystemObjectUploadRedirect, truncateWithEllipses } from '../../../../../constants/helperfunctions';
import { rollbackSystemObjectVersion, useObjectAssets } from '../../../hooks/useDetailsView';
import { useStyles } from './AssetGrid';
import { PublishedStateEnumToString, eSystemObjectType } from '../../../../../types/server';
import GetAppIcon from '@material-ui/icons/GetApp';
import { SystemObjectVersion } from '../../../../../types/graphql';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router-dom';
import { MdExpandMore, MdExpandLess } from 'react-icons/md';
import API from '../../../../../api';

interface ObjectVersionsTableProps {
    idSystemObject: number;
    objectVersions: SystemObjectVersion[];
    systemObjectType?: eSystemObjectType | undefined;
}

interface headerColumn {
    name: string;
    width: number | string;
}

function ObjectVersionsTable(props: ObjectVersionsTableProps): React.ReactElement {
    const classes = useStyles();
    const { objectVersions, idSystemObject, systemObjectType } = props;
    const serverEndpoint = API.serverEndpoint();
    const history = useHistory();
    const [expanded, setExpanded] = useState<number>(-1);
    const [rollbackNotes, setRollbackNotes] = useState<string>('');

    const headers: headerColumn[] = [{ name: 'Date', width: '10%' }, { name: 'Link', width: '5%' }, { name: 'Published State', width: '15%' }, { name: 'Action', width: '10%' }, { name: 'Notes', width: '60%' }];


    const { data } = useObjectAssets(idSystemObject);

    if (!objectVersions)
        return <EmptyTable />;

    const onRollback = async (idSystemObjectVersion: number) => {
        if (rollbackNotes.length < 1) {
            toast.error('Please provide rollback notes');
            return;
        }
        const { data } = await rollbackSystemObjectVersion(idSystemObjectVersion, rollbackNotes);
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
            <table className={classes.container} style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ width: '100%', borderBottom: '1px solid grey' }}>
                        {headers.map(({ name, width }, index: number) => (
                            <th key={index} align='center' style={{ width, padding: 5 }}>
                                <Typography className={classes.header}>{name}</Typography>
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {objectVersions.map((version, index) =>  {
                        const rollback = () => onRollback(version.idSystemObjectVersion);
                        const cancel = () => onExpand(index);
                        const comment =
                            version.Comment ? (
                                <Tooltip arrow title={ <ToolTip text={truncateWithEllipses(version.Comment, 1000)} /> }>
                                    {version.CommentLink ? <a href={version.CommentLink} style={{ display: 'flex', justifyContent: 'center', color: 'black' }} target='_blank' rel='noreferrer noopener'>
                                        <Typography className={clsx(classes.value)}>
                                            {truncateWithEllipses(version.Comment, 30)}
                                        </Typography>
                                    </a> : <Typography className={clsx(classes.value)}>
                                        {truncateWithEllipses(version.Comment, 30)}
                                    </Typography>}
                                </Tooltip>
                            ) : null;

                        return (
                            <React.Fragment key={index}>
                                <tr key={index}>
                                    <td align='center' style={{ padding: 0 }}>
                                        <Typography className={clsx(classes.value)}>{extractISOMonthDateYear(version.DateCreated)}</Typography>
                                    </td>
                                    <td align='center' style={{ padding: 0 }}>
                                        <a
                                            href={getDownloadObjectVersionUrlForObject(serverEndpoint, version.idSystemObjectVersion)}
                                            style={{ textDecoration: 'none', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <GetAppIcon />
                                        </a>
                                    </td>
                                    <td align='center' style={{ padding: 0 }}>
                                        <Typography className={clsx(classes.value)}>{PublishedStateEnumToString(version.PublishedState)}</Typography>
                                    </td>
                                    <td align='center' style={{ padding: 0 }}>
                                        {index >= objectVersions.length - 1 ? null : (
                                            <Typography
                                                style={{ width: 'fit-content', whiteSpace: 'nowrap', color: 'rgb(0,121,196)', cursor: 'pointer' }}
                                                onClick={() => onExpand(index)}
                                                className={clsx(classes.value)}
                                            >
                                                Rollback
                                                {expanded === index ? <MdExpandLess /> : <MdExpandMore />}
                                            </Typography>
                                        )}
                                    </td>
                                    <td style={{ padding: 0 }}>
                                        {comment}
                                    </td>
                                </tr>
                                {
                                    expanded === index ? (
                                        <tr>
                                            <td style={{ width: '60%' }} colSpan={5} align='center'>
                                                <Box display='flex' style={{ width: '90%', alignItems: 'center', columnGap: '10px' }}>
                                                    <TextArea value={rollbackNotes} name='rollbackNotes' onChange={(e) => setRollbackNotes(e.target.value)} placeholder='Please provide rollback notes...' rows='4' />
                                                    <Box style={{ columnGap: '3px', display: 'flex' }}>
                                                        <Button onClick={rollback} className={classes.btn} style={{ padding: 2.5 }} variant='contained' color='primary'>Rollback</Button>
                                                        <Button onClick={cancel} className={classes.btn} style={{ padding: 0 }} variant='contained' color='primary'>Cancel</Button>
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
            <Button className={classes.btn} variant='contained' color='primary' style={{ width: 'fit-content' }} onClick={redirect}>
                Add Version
            </Button>
        </Box>
    );
}

export default ObjectVersionsTable;
