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

    const headers: string[] = ['Link', 'Version', 'Name', 'Creator', 'Date Created', 'Size', 'Ingested', 'Notes', 'Action'];

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
                {versions.map((version: StateDetailVersion, index: number) => {
                    const rollback = () => onRollback(version.idAssetVersion);
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
                                <td>
                                    <a
                                        href={getDownloadAssetVersionUrlForObject(serverEndpoint, version.idAssetVersion)}
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
                                    <Tooltip arrow title={ <ToolTip text={formatDateAndTime(version.dateCreated)} /> }>
                                        <Typography className={classes.value}>{formatDate(version.dateCreated)}</Typography>
                                    </Tooltip>
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
                                <td>
                                    {comment}
                                </td>
                                <td align='center'>
                                    {index >= versions.length - 1 ? null : (
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
                            </tr>
                            {
                                expanded === index ? (
                                    <tr>
                                        <td colSpan={4} align='center'>
                                            <TextArea value={rollbackNotes} name='rollbackNotes' onChange={(e) => setRollbackNotes(e.target.value)} placeholder='Please provide rollback notes...' rows='4' />
                                        </td>
                                        <td colSpan={3} align='left'>
                                            <Box>
                                                <Button onClick={rollback} className={classes.btn} style={{ padding: 2.5, marginRight: '4px' }} variant='contained' color='primary'>Rollback</Button>
                                                <Button onClick={cancel} className={classes.btn} style={{ padding: 0 }} variant='contained' color='primary'>Cancel</Button>
                                            </Box>
                                        </td>
                                    </tr>
                                ) : null
                            }
                        </React.Fragment>
                    );
                })}
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
