/**
 * StyledTreeItem
 *
 * This component renders a custom tree item for RepositoryTreeView.
 */
import { fade, Theme, withStyles } from '@material-ui/core/styles';
import { TreeItem, TreeItemProps } from '@material-ui/lab';
import React from 'react';

interface StyledTreeItemProps {
    color: string;
}

const StyledTreeItem = withStyles(({ palette, typography, breakpoints }: Theme) => ({
    iconContainer: {
        width: 25,
        left: 2.5,
        zIndex: 10,
        [breakpoints.down('lg')]: {
            width: 15,
            left: 4,
            marginLeft: 4
        },
        '& .close': {
            opacity: 0.3
        }
    },
    root: {
        marginTop: 2.5,
        marginBottom: 2.5,
        '&:focus': {
            '& > div': {
                outline: `1px solid ${palette.primary.main}`,
            }
        },
        borderRadius: 5,
        paddingLeft: 1,
        direction: 'ltr',
        textAlign: 'left'
    },
    group: {
        paddingLeft: 20,
        borderLeft: `1px dashed ${fade(palette.text.primary, 0.2)}`,
        [breakpoints.down('lg')]: {
            paddingLeft: 15
        }
    },
    label: {
        fontSize: '0.7em',
        fontWeight: typography.fontWeightLight,
        borderRadius: 5,
        padding: '2.5px 5px',
        [breakpoints.down('lg')]: {
            padding: '4px 8px'
        },
        backgroundColor: 'transparent !important'
    },
    content: {
        backgroundColor: ({ color }: StyledTreeItemProps) => color,
        borderRadius: 5,
        transition: 'all 200ms ease'
    },
    selected: {
        backgroundColor: 'transparent'
    }
}))((props: TreeItemProps & StyledTreeItemProps) => <TreeItem {...props} />);

export default React.memo(StyledTreeItem);
