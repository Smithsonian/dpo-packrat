/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

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
        },
        direction: 'ltr'
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

        const tree = document.getElementById('treeView') as HTMLElement;
        tree?.focus();
        const handleRepositoryKeyStrokes = (e: KeyboardEvent) => {
            if (e.key === 'PageUp') {
                const lis = Array.from(document.querySelectorAll('li'));
                if (!lis.length) return;
                const originalRect = lis[0].getBoundingClientRect();

                setTimeout(() => {
                    const hasScrolled = hasViewContainerScrolled(originalRect, document.querySelector('li')?.getBoundingClientRect() as DOMRect);
                    const target = hasScrolled ? getLastElementInView(lis, tree) : getFirstElementInView(lis, tree);
                    target?.focus();
                }, 200);
            }
            if (e.key === 'PageDown') {
                const lis = Array.from(document.querySelectorAll('li'));
                if (!lis.length) return;
                const originalRect = lis[0].getBoundingClientRect();

                setTimeout(() => {
                    const hasScrolled = hasViewContainerScrolled(originalRect, document.querySelector('li')?.getBoundingClientRect() as DOMRect);
                    const target = hasScrolled ? getFirstElementInView(lis, tree) : getLastElementInView(lis, tree);
                    target?.focus();
                }, 200);
            }

            if (e.key === 'Enter') {
                e.stopPropagation();
                const active = document.activeElement;
                if (!active) return;
                const icon = active.children[0]?.children[0]?.children[0] as null | HTMLElement;
                if (icon) icon.click();
            }
        };

        tree?.addEventListener('keydown', handleRepositoryKeyStrokes);

        return () => {
            columnSet.forEach((col) => col.unobserve);
            tree?.removeEventListener('keydown', handleRepositoryKeyStrokes);
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


export function isElementInView (child: HTMLElement, parent: HTMLElement) {
    if (!child || !parent) return false;
    const childRect = child.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    return (childRect.top > parentRect.top && childRect.bottom < parentRect.bottom);
}

export function getFirstElementInView (elements, parent) {
    for (let i = 0; i < elements.length; i++) {
        if (isElementInView(elements[i], parent))
            return elements[i];
    }
}

export function getLastElementInView (elements, parent) {
    for (let i = 0; i < elements.length - 1; i++) {
        if (isElementInView(elements[i], parent) && !isElementInView(elements[i+1], parent))
            return elements[i + 1] ? elements[i + 1] : elements[i];
    }
}

export function hasViewContainerScrolled (originalPos: DOMRect, newPos: DOMRect) {
    return originalPos.y !== newPos.y;
}