import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
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
            left: 35
        }
    },
    labelText: {
        width: '60%',
        background: ({ color }: TreeLabelProps) => color,
        zIndex: 10,
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
        position: 'sticky',
        left: 20,
        [breakpoints.down('lg')]: {
            height: 30,
        }
    },
    emptyText: {
        fontSize: '0.75em',
        fontWeight: typography.fontWeightLight,
        color: palette.grey[500]
    }
}));

export function TreeLabelLoading(): React.ReactElement {
    const classes = useLabelStyle();
    return (
        <div className={classes.container}>
            <Progress size={15} />
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
            <Typography className={classes.emptyText}>{contentTerm}</Typography>
        </div>
    );
}

export default TreeLabel;