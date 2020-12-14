/**
 * TreeLabel
 *
 * This component renders a tree label for StyledTreeItem.
 */
import { Box } from '@material-ui/core';
import { grey } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import lodash from 'lodash';
import React, { useMemo } from 'react';
import { FaCheckCircle, FaRegCircle } from 'react-icons/fa';
import { NewTabLink, Progress } from '../../../../components';
import { palette } from '../../../../theme';
import { getDetailsUrlForObject, getTermForSystemObjectType } from '../../../../utils/repository';
import MetadataView, { TreeViewColumn } from './MetadataView';
import { RiExternalLinkFill } from 'react-icons/ri';

const useStyles = makeStyles(({ breakpoints }) => ({
    container: {
        display: 'flex',
    },
    label: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        position: 'sticky',
        left: 45,
        [breakpoints.down('lg')]: {
            left: 30
        }
    },
    labelText: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '60%',
        fontSize: '0.8em',
        background: ({ color }: TreeLabelProps) => color,
        zIndex: 10,
        [breakpoints.down('lg')]: {
            fontSize: '0.9em',
        }
    },
    options: {
        display: 'flex'
    }
}));

interface TreeLabelProps {
    idSystemObject: number;
    label?: React.ReactNode;
    objectType: number;
    color: string;
    treeColumns: TreeViewColumn[];
    renderSelected?: boolean;
    selected?: boolean;
    onSelect?: (event: React.MouseEvent<SVGElement, MouseEvent>) => void;
    onUnSelect?: (event: React.MouseEvent<SVGElement, MouseEvent>) => void;
}

function TreeLabel(props: TreeLabelProps): React.ReactElement {
    const { idSystemObject, label, treeColumns, renderSelected = false, selected = false, onSelect, onUnSelect, objectType } = props;
    const classes = useStyles(props);
    const objectTitle = useMemo(() => `${getTermForSystemObjectType(objectType)} ${label}`, [objectType, label]);

    return (
        <div className={classes.container}>
            <div className={classes.label}>
                {renderSelected && (
                    <Box display='flex' alignItems='center' mr='10px'>
                        {!selected && <FaRegCircle size={16} color={grey[400]} onClick={onSelect} />}
                        {selected && <FaCheckCircle size={16} color={palette.primary.main} onClick={onUnSelect} />}
                    </Box>
                )}
                <div className={classes.labelText}>
                    <span title={objectTitle}>{label}</span>
                    <NewTabLink className={classes.options} to={getDetailsUrlForObject(idSystemObject)}>
                        <RiExternalLinkFill size={16} color={palette.primary.main} />
                    </NewTabLink>
                </div>
            </div>
            <MetadataView header={false} treeColumns={treeColumns} />
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
        fontSize: '0.8em',
        fontWeight: typography.fontWeightLight,
        color: palette.grey[500],
        [breakpoints.down('lg')]: {
            fontSize: '0.7em',
        }
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
            <Progress className={classes.stickyItem} size={15} />
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