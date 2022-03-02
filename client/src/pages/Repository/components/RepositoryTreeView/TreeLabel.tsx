/**
 * TreeLabel
 *
 * This component renders a tree label for StyledTreeItem.
 * The label includes the SO type icon, SO name, and external link icon
 */
import { Box } from '@material-ui/core';
import { grey } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import lodash from 'lodash';
import React, { useMemo, useState, useEffect } from 'react';
import { FaCheckCircle, FaRegCircle } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { palette } from '../../../../theme';
import { getDetailsUrlForObject, getTermForSystemObjectType } from '../../../../utils/repository';
import MetadataView, { TreeViewColumn } from './MetadataView';

interface TreeLabelProps {
    idSystemObject: number;
    label?: React.ReactNode;
    objectType: number;
    color: string;
    treeColumns: TreeViewColumn[];
    renderSelected?: boolean;
    selected?: boolean;
    makeStyles?: { [key: string]: string };
    onSelect?: (event: React.MouseEvent<SVGElement, MouseEvent>) => void;
    onUnSelect?: (event: React.MouseEvent<SVGElement, MouseEvent>) => void;
}

// pass the event handler for clicking to this component
function TreeLabel(props: TreeLabelProps): React.ReactElement {
    const { idSystemObject, label, treeColumns, renderSelected = false, selected = false, onSelect, onUnSelect, objectType, makeStyles, color } = props;
    const [waitTime, setWaitTime] = useState<NodeJS.Timeout[]>([]);
    const objectTitle = useMemo(() => `${getTermForSystemObjectType(objectType)} ${label}`, [objectType, label]);
    const WAIT_INTERVAL_MS = 200;
    const onClick = async (e) => {
        e.stopPropagation();
        // if there's already a click, that means we want to stop the timeout for that and just open a new tab
        // otherwise just set a timer that'll expand the node in 200 ms
        if (waitTime.length) {
            clearTimeout(waitTime[0]);
            setWaitTime([]);
            window.open(getDetailsUrlForObject(idSystemObject), '_blank')?.focus();
            return;
        } else {
            const timer = setTimeout(() => { const target = document.getElementById(`repository row id ${idSystemObject}`)?.firstChild as HTMLElement; target.click(); }, WAIT_INTERVAL_MS);
            setWaitTime([timer]);
        }
    };

    // this useEffect is to reset the wait time from the first click after a set amount of time so that it doesn't register the next single click as a second click
    useEffect(() => {
        if (waitTime.length === 1) {
            setTimeout(() => {
                setWaitTime([]);
            }, WAIT_INTERVAL_MS);
        }
    }, [waitTime]);

    return (
        <div className={makeStyles?.container}>
            <div className={makeStyles?.label}>
                {renderSelected && (
                    <Box display='flex' alignItems='center' mr='10px'>
                        {!selected && <FaRegCircle size={16} color={grey[400]} onClick={onSelect} />}
                        {selected && <FaCheckCircle size={16} color={palette.primary.main} onClick={onUnSelect} />}
                    </Box>
                )}
                <div className={makeStyles?.labelText} style={{ backgroundColor: color }}>
                    <span title={objectTitle} onClick={onClick}>{label}</span>
                </div>
            </div>
            <MetadataView header={false} treeColumns={treeColumns} makeStyles={{ text: makeStyles?.text || '', column: makeStyles?.column || '' }} />
        </div>
    );
}

const useLabelStyle = makeStyles(({ breakpoints, palette, typography }) => ({
    container: {
        display: 'flex',
        alignItems: 'center',
        height: 40,
        [breakpoints.down('lg')]: {
            height: 30,
        }
    },
    emptyText: {
        fontSize: '0.7em',
        fontWeight: typography.fontWeightLight,
        color: palette.grey[500]
    },
    stickyItem: {
        position: 'sticky',
        left: 0,
    }
}));

export function TreeLabelLoading(): React.ReactElement {
    const classes = useLabelStyle();
    return (
        <div className={classes.container}>
            <AiOutlineLoading3Quarters className={classes.stickyItem} size={15} style={{ color: '#0079C4' }} />
        </div>
    );
}

interface TreeLabelEmptyProps {
    label: string;
    objectType: number;
}

export function TreeLabelEmpty(props: TreeLabelEmptyProps): React.ReactElement {
    const { label, objectType } = props;
    const classes = useLabelStyle();
    const term = getTermForSystemObjectType(objectType);
    const contentTerm = `No objects found for ${term} ${label}`;

    return (
        <div className={classes.container}>
            <span className={clsx(classes.emptyText, classes.stickyItem)}>{contentTerm}</span>
        </div>
    );
}

export default React.memo(TreeLabel, lodash.isEqual);