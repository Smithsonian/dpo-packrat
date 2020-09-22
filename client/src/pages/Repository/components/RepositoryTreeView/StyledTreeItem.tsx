import { Collapse } from '@material-ui/core';
import { fade, withStyles, Theme } from '@material-ui/core/styles';
import { TreeItem, TreeItemProps } from '@material-ui/lab';
import React from 'react';
import { animated, useSpring } from 'react-spring';

interface TransitionComponentProps {
    in?: boolean;
}

function TransitionComponent(props: TransitionComponentProps): React.ReactElement {
    const style = useSpring({
        from: { opacity: 0, transform: 'translate3d(20px,0,0)' },
        to: {
            opacity: props.in ? 1 : 0,
            transform: `translate3d(${props.in ? 0 : 20}px,0,0)`
        }
    });

    return (
        <animated.div style={style}>
            <Collapse {...props} />
        </animated.div>
    );
}

const StyledTreeItem = withStyles(({ palette, typography, breakpoints }: Theme) => ({
    iconContainer: {
        width: 25,
        '& .close': {
            opacity: 0.3
        },
        [breakpoints.down('lg')]: {
            width: 15
        }
    },
    root: {
        marginTop: 5
    },
    group: {
        marginLeft: 8,
        paddingLeft: 20,
        borderLeft: `1px dashed ${fade(palette.text.primary, 0.4)}`
    },
    label: {
        fontSize: 16,
        fontWeight: typography.fontWeightLight,
        borderRadius: 5,
        padding: '5px 10px',
        [breakpoints.down('lg')]: {
            fontSize: 12,
            padding: '3px 6px',
        }
    }
}))((props: TreeItemProps) => <TreeItem {...props} TransitionComponent={TransitionComponent} />);

export default StyledTreeItem;
