import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';
import { Progress } from '../../../../components';
import { getTermForSystemObjectType } from '../../../../utils/repository';
import MetadataView, { TreeViewColumn } from './MetadataView';

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
        width: '60%',
        fontSize: '0.8em',
        background: ({ color }: TreeLabelProps) => color,
        zIndex: 10,
        [breakpoints.down('lg')]: {
            fontSize: '0.9em',
        }
    }
}));

interface TreeLabelProps {
    label?: React.ReactNode;
    objectType: number;
    color: string;
    treeColumns: TreeViewColumn[];
}

function TreeLabel(props: TreeLabelProps): React.ReactElement {
    const { label, treeColumns, objectType } = props;
    const classes = useStyles(props);
    const objectTitle = `${getTermForSystemObjectType(objectType)} ${label}`;

    return (
        <div className={classes.container}>
            <div className={classes.label}>
                <div className={classes.labelText}>
                    <span title={objectTitle}>{label}</span>
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

export default TreeLabel;