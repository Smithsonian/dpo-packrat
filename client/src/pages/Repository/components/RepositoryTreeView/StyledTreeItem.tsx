import { fade, Theme, withStyles } from '@material-ui/core/styles';
import { TreeItem, TreeItemProps } from '@material-ui/lab';
import React from 'react';

interface StyledTreeItemProps {
    color: string;
}

const StyledTreeItem = withStyles(({ palette, typography, breakpoints }: Theme) => ({
    iconContainer: {
        width: 25,
        marginLeft: 5,
        position: 'sticky',
        left: 10,
        zIndex: 10,
        [breakpoints.down('lg')]: {
            width: 15,
            marginLeft: 8
        },
        '& .close': {
            opacity: 0.3
        }
    },
    root: {
        marginTop: 5
    },
    group: {
        paddingLeft: 20,
        borderLeft: `1px dashed ${fade(palette.text.primary, 0.2)}`,
        [breakpoints.down('lg')]: {
            paddingLeft: 15
        }
    },
    label: {
        fontSize: 16,
        fontWeight: typography.fontWeightLight,
        borderRadius: 5,
        padding: '2.5px 5px',
        [breakpoints.down('lg')]: {
            fontSize: '0.7em'
        },
        backgroundColor: 'transparent !important',
        '&:hover': {
            backgroundColor: 'transparent'
        }
    },
    content: {
        backgroundColor: ({ color }: StyledTreeItemProps) => color,
        borderRadius: 5,
        transition: 'all 200ms ease',
        '&:hover': {
            transform: 'scale(1.01)'
        }
    },
    selected: {
        backgroundColor: 'transparent'
    }
}))((props: TreeItemProps & StyledTreeItemProps) => <TreeItem {...props} />);

export default StyledTreeItem;
