import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { eMetadata } from '../../../../types/server';
import { computeMetadataViewWidth, trimmedMetadataField } from '../../../../utils/repository';

export type TreeViewColumn = {
    metadataColumn: eMetadata;
    label: string;
    size: number;
};

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    metadata: {
        display: 'flex'
    },
    column: {
        display: 'flex',
        alignItems: 'center',
        padding: '0px 10px',
        fontSize: ({ header }: MetadataViewProps) => header ? typography.pxToRem(18) : undefined,
        color: ({ header }: MetadataViewProps) => header ? palette.primary.dark : palette.grey[900],
        fontWeight: ({ header }: MetadataViewProps) => header ? typography.fontWeightRegular : typography.fontWeightLight,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        [breakpoints.down('lg')]: {
            fontSize: ({ header }: MetadataViewProps) => header ? typography.pxToRem(14) : undefined,
        }
    },
    text: {
        fontSize: '0.8em',
        [breakpoints.down('lg')]: {
            fontSize: '0.9em',
        }
    }
}));

interface MetadataViewProps {
    header: boolean;
    treeColumns: TreeViewColumn[];
}

function MetadataView(props: MetadataViewProps): React.ReactElement {
    const { header, treeColumns } = props;
    const classes = useStyles(props);

    const width = computeMetadataViewWidth(treeColumns);

    const renderTreeColumns = (treeColumns: TreeViewColumn[]) =>
        treeColumns.map((treeColumn: TreeViewColumn, index: number) => {
            const { label, size } = treeColumn;
            const width = `${size}vw`;

            return (
                <div key={index} className={classes.column} style={{ width }}>
                    <span className={classes.text} title={header ? undefined : label} data-tooltip-position='bottom'>
                        {trimmedMetadataField(label, 20, 10)}
                    </span>
                </div>
            );
        });

    return (
        <div className={classes.metadata} style={{ width }}>
            {renderTreeColumns(treeColumns)}
        </div>
    );
}

export default React.memo(MetadataView);
