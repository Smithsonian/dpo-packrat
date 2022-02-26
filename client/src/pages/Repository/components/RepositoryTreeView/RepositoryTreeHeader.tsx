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
import { debounce } from 'lodash';

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
        [breakpoints.down('lg')]: {
            minHeight: 40
        }
    },
    treeView: {
        display: 'flex',
        position: 'sticky',
        left: 0,
        alignItems: 'center',
        color: palette.primary.dark,
        fontSize: typography.pxToRem(15),
        fontWeight: typography.fontWeightRegular,
        width: 'calc(30vw + 25px)',
        flex: 0.9
    },
    treeViewText: {
        left: 20,
        height: 20,
        paddingLeft: 20,
        width: '60%',
        backgroundColor: palette.primary.light,
        [breakpoints.down('lg')]: {
            paddingLeft: 10,
            left: 10,
        }
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
        overflow: 'auto',
        textOverflow: 'ellipsis',
        resize: 'horizontal'
    },
    text: {
        fontSize: '0.9em',
    }
}));

const metadataColumns = {};
for (const col in eMetadata) {
    metadataColumns[eMetadata[col]] =  {
        width: (
            widths: { [name: string] : string }) => `${widths[eMetadata[col]]}px` || '50px',
            minWidth: 50
        }
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
    const [updateWidth, widths, initializeClasses] = useTreeColumnsStore(state => [state.updateWidth, state.widths, state.initializeClasses]);
    const classes = useStyles();
    const columnClasses = useColumnStyles(widths); 
    const treeColumns = getTreeViewColumns(metadataColumns, true);
    
    useEffect(() => {
        initializeClasses(columnClasses);
        const columnSet = new Set<ResizeObserver>();
        
        // Debouncing the width update makes the transition smoother
        const debounceUpdateWidth = debounce(updateWidth, 5);
        treeColumns.forEach((col) => {
            const target = document.getElementById(`column-${col.label}`);
            if (target) {
                const columnObersver = new ResizeObserver((e) => {                    
                    debounceUpdateWidth(col.metadataColumn as number, String(e[0].contentRect.width));
                });
                columnObersver.observe(target);
                columnSet.add(columnObersver);
            }
        });

        return () => {
            columnSet.forEach((col) => col.unobserve);
        }
    }, []);

    return (
        <Box className={classes.container}>
            <Box className={classes.treeView}>
                <Box className={classes.treeViewText} />
            </Box>
            <MetadataView header treeColumns={treeColumns} makeStyles={{ text: classes.text, column: classes.column }} />
        </Box>
    );
}

export default React.memo(RepositoryTreeHeader);