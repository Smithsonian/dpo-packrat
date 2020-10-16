import { fade, Theme, withStyles } from '@material-ui/core/styles';
import { TreeItem, TreeItemProps } from '@material-ui/lab';
import React from 'react';

interface StyledTreeItemProps {
    color: string;
}

const StyledTreeItem = withStyles(({ palette, typography, breakpoints }: Theme) => ({
    iconContainer: {
        width: 25,
        position: 'sticky',
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
            fontSize: '0.7em',
            padding: '4px 8px'
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

export default React.memo(StyledTreeItem);
