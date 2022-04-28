/* eslint-disable react-hooks/exhaustive-deps */

/**
 * RepositoryTreeHeader
 *
 * This component renders header for RepositoryTreeView.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect } from 'react';
import { eMetadata } from '@dpo-packrat/common';
import { getTreeViewColumns } from '../../../../utils/repository';
import MetadataView from './MetadataView';
import ResizeObserver from 'resize-observer-polyfill';
import { useTreeColumnsStore } from '../../../../store';
import clsx from 'clsx';

const SO_NAME_COLUMN_HEADER = 'object-name';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    container: {
        display: 'flex',
        alignItems: 'center',
        height: 'fit-content',
        backgroundColor: palette.primary.light,
        borderRadius: 5,
        marginBottom: 5,
        position: 'sticky',
        top: 0,
        zIndex: 20,
        paddingRight: 5,
        [breakpoints.down('lg')]: {
            minHeight: 40
        }
    },
    treeView: {
        display: 'flex',
        left: 0,
        alignItems: 'center',
        color: palette.primary.dark,
        fontSize: typography.pxToRem(15),
        fontWeight: typography.fontWeightRegular,
        flex: 1,
    },
    treeViewText: {
        left: 20,
        height: '0.9rem',
        paddingLeft: 20,
        backgroundColor: palette.primary.light,
        [breakpoints.down('lg')]: {
            paddingLeft: 10,
            left: 10,
        },
        resize: 'horizontal',
        overflow: 'hidden',
        minWidth: '150px'
    },
    metadata: {
        display: 'flex'
    },
    column: {
        display: 'flex',
        alignItems: 'center',
        padding: '0px 10px',
        fontSize: typography.pxToRem(14),
        color: palette.primary.dark,
        fontWeight: typography.fontWeightRegular,
        overflow: 'hidden',
        resize: 'horizontal',
        minWidth: 50
    },
    text: {
        fontSize: '0.9em',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    }
}));

const metadataColumns = {
    [SO_NAME_COLUMN_HEADER]: {
        width:  ( widths: { [name: string]: string }) => `${widths[SO_NAME_COLUMN_HEADER]}px` ?? '150px'
    }
};
for (const col in eMetadata) {
    metadataColumns[eMetadata[col]] =  {
        width: (
            widths: { [name: string]: string }) => `${widths[eMetadata[col]]}px` ?? '50px'
    };
}

const useColumnStyles = makeStyles(() => ({
    ...metadataColumns
}));

interface RepositoryTreeHeaderProps {
    fullWidth?: boolean;
    metadataColumns: eMetadata[];
}

function RepositoryTreeHeader(props: RepositoryTreeHeaderProps): React.ReactElement {
    const { metadataColumns } = props;
    const [updateWidth, widths, initializeClasses, columnOrder] = useTreeColumnsStore(state => [state.updateWidth, state.widths, state.initializeClasses, state.order]);
    const classes = useStyles();
    const columnClasses = useColumnStyles(widths);
    const treeColumns = getTreeViewColumns(metadataColumns, true);
    if (treeColumns)
        treeColumns.sort((a, b) => Number(columnOrder[a.metadataColumn]) - Number(columnOrder[b.metadataColumn]));

    useEffect(() => {
        initializeClasses(columnClasses);
        const columnSet = new Set<ResizeObserver>();

        // Debouncing the width update makes the transition smoother
        const nameHeader = document.getElementById(SO_NAME_COLUMN_HEADER);
        const columnObersver = new ResizeObserver((e) => {
            updateWidth(SO_NAME_COLUMN_HEADER, String(e[0].contentRect.width));
        });
        if (nameHeader)
            columnObersver.observe(nameHeader);

        treeColumns.forEach((col) => {
            const target = document.getElementById(`column-${col.label}`);
            if (target) {
                const columnObersver = new ResizeObserver((e) => {
                    updateWidth(col.metadataColumn as number, String(e[0].contentRect.width));
                });
                columnObersver.observe(target);
                columnSet.add(columnObersver);
            }
        });

        const tree = document.getElementById('treeView');
        tree?.focus();

        return () => {
            columnSet.forEach((col) => col.unobserve);
        };
    }, []);

    return (
        <Box className={classes.container}>
            <Box className={classes.treeView}>
                <Box className={clsx(classes.treeViewText, columnClasses[SO_NAME_COLUMN_HEADER])} id={SO_NAME_COLUMN_HEADER} style={{ padding: '10px 0px' }} />
            </Box>
            <MetadataView header treeColumns={treeColumns} makeStyles={{ text: classes.text, column: classes.column }} />
        </Box>
    );
}

export default React.memo(RepositoryTreeHeader);