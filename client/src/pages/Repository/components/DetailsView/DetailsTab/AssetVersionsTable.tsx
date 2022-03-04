/* eslint-disable react/jsx-max-props-per-line */
/**
 * AssetVersionsTable
 *
 * This component renders asset version table tab for the DetailsTab component.
 */
import { Box, Checkbox, Typography, Button, Tooltip } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { useState } from 'react';
import { EmptyTable, NewTabLink, TextArea, ToolTip } from '../../../../../components';
import { StateDetailVersion } from '../../../../../store';
import { getDetailsUrlForObject, getDownloadAssetVersionUrlForObject } from '../../../../../utils/repository';
import { formatDate, formatDateAndTime } from '../../../../../utils/shared';
import { formatBytes } from '../../../../../utils/upload';
import { useObjectVersions, rollbackAssetVersion } from '../../../hooks/useDetailsView';
import { useStyles } from './AssetGrid';
import GetAppIcon from '@material-ui/icons/GetApp';
import API from '../../../../../api';
import { truncateWithEllipses } from '../../../../../constants/helperfunctions';
import { MdExpandMore, MdExpandLess } from 'react-icons/md';
import { toast } from 'react-toastify';

interface AssetVersionsTableProps {
    idSystemObject: number;
}

interface headerColumn {
    name: string;
    width?: number | string;
    flex?: string;
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
    const serverEndpoint = API.serverEndpoint();
    const { data, loading } = useObjectVersions(idSystemObject);
    const [expanded, setExpanded] = useState<number>(-1);
    const [rollbackNotes, setRollbackNotes] = useState<string>('');
    const headers: headerColumn[] = [
        {
            name: 'Link',
            width: '30px',
        }, {
            name: 'Version',
            width: '70px',
        }, {
            name: 'Name',
            width: '180px'
        }, {
            name: 'Creator',
            width: '70px',
        }, {
            name: 'Date Created',
            width: '100px'
        }, {
            name: 'Size',
            width: '70px'
        }, {
            name: 'Ingested',
            width: '70px'
        }, {
            name: 'Notes',
            flex: '1'
        }, {
            name: 'Action',
            width: '70px'
        }

    ];

    if (!data || loading)
        return <EmptyTable />;

    const onRollback = async (idAssetVersion: number) => {
        if (rollbackNotes.length < 1) {
            toast.error('Please provide rollback notes');
            return;
        }
        const { data } = await rollbackAssetVersion(idAssetVersion, rollbackNotes);
        if (data.rollbackAssetVersion.success) {
            toast.success(`Successfully rolled back to to ${idAssetVersion}!`);
            setRollbackNotes('');
            setExpanded(-1);
            window.location.reload();
        } else {
            toast.error(`Error when attempting to rollback to ${idAssetVersion}. Reason: ${data.message}`);
        }
    };

    const onExpand = (row) => {
        setRollbackNotes('');
        setExpanded(row === expanded ? -1 : row);
    };

    const { versions } = data.getVersionsForAsset;

    return (
        <Box style={{ minWidth: '850px' }}>
            <table className={clsx(classes.container, classes.fixedTable)}>
                <thead>
                    <tr style={{ borderBottom: '1px solid grey' }} >
                        {headers.map(({ name, width, flex }, index: number) => (
                            <th key={index} className={classes.tableCell} align='center' style={{ padding: '0 5px 0 5px', width, flex }}>
                                <Typography className={classes.header}>{name}</Typography>
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {versions.map((version: StateDetailVersion, index: number) => {
                        const rollback = () => onRollback(version.idAssetVersion);
                        const cancel = () => onExpand(index);

                        const comment =
                            version.Comment ? (
                                <Tooltip arrow title={ <ToolTip text={truncateWithEllipses(version.Comment, 1000)} /> } placement='left' >
                                    {version.CommentLink ? <a href={version.CommentLink} style={{ display: 'flex', justifyContent: 'end', color: 'black' }} target='_blank' rel='noreferrer noopener'>
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
                                    <td className={classes.tableCell}>
                                        <a
                                            href={getDownloadAssetVersionUrlForObject(serverEndpoint, version.idAssetVersion)}
                                            className={classes.downloadIconLink}
                                        >
                                            <GetAppIcon />
                                        </a>
                                    </td>
                                    <td align='center' className={classes.tableCell}>
                                        <NewTabLink to={getDetailsUrlForObject(version.idSystemObject)}>
                                            <Typography className={clsx(classes.value, classes.link)}>{version.version}</Typography>
                                        </NewTabLink>
                                    </td>
                                    <td align='center' className={clsx(classes.tableCell, classes.ellipsisCell)}>
                                        <NewTabLink to={getDetailsUrlForObject(version.idSystemObject)}>
                                            <Tooltip arrow title={version.name} placement='left'>
                                                <Typography className={clsx(classes.value, classes.link)} style={{ display: 'initial' }}>{version.name}</Typography>
                                            </Tooltip>
                                        </NewTabLink>
                                    </td>
                                    <td align='center' className={classes.tableCell}>
                                        <Typography className={classes.value}>{version.creator}</Typography>
                                    </td>
                                    <td align='center' className={classes.tableCell}>
                                        <Tooltip arrow title={ <ToolTip text={formatDateAndTime(version.dateCreated)} /> }>
                                            <Typography className={classes.value}>{formatDate(version.dateCreated)}</Typography>
                                        </Tooltip>
                                    </td>
                                    <td align='center' className={classes.tableCell}>
                                        <Typography className={classes.value}>{formatBytes(version.size)}</Typography>
                                    </td>
                                    <td align='center' className={classes.tableCell}>
                                        <CheckboxNoPadding
                                            disabled
                                            checked={version.ingested ?? false}
                                            color='primary'
                                        />
                                    </td>
                                    <td className={clsx(classes.tableCell, classes.ellipsisCell)}>
                                        {comment}
                                    </td>
                                    <td align='center' className={classes.tableCell}>
                                        {index >= versions.length - 1 ? null : (
                                            <Typography
                                                onClick={() => onExpand(index)}
                                                className={clsx(classes.value, classes.rollbackText)}
                                            >
                                                Rollback
                                                {expanded === index ? <MdExpandLess /> : <MdExpandMore />}
                                            </Typography>
                                        )}
                                    </td>
                                </tr>
                                {
                                    expanded === index ? (
                                        <tr>
                                            <td colSpan={9} align='center'>
                                                <Box className={classes.rollbackContainer}>
                                                    <TextArea value={rollbackNotes} name='rollbackNotes' onChange={(e) => setRollbackNotes(e.target.value)} placeholder='Please provide rollback notes...' rows='4' />
                                                    <Box style={{ columnGap: '3px', display: 'flex' }}>
                                                        <Button onClick={rollback} className={classes.btn} style={{ padding: 2.5, marginRight: '4px' }} variant='contained' color='primary'>Rollback</Button>
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
                    {!versions.length && (
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
        </Box>
    );
}

export default AssetVersionsTable;
