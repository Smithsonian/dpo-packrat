import { Box, Collapse, Tooltip } from '@material-ui/core';
import { fade, withStyles, Theme, makeStyles } from '@material-ui/core/styles';
import { TreeItem, TreeItemProps } from '@material-ui/lab';
import React from 'react';
import { animated, useSpring } from 'react-spring';
import { trimmedMetadataField } from '../../../../utils/repository';

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

interface StyledTreeItemProps {
    color: string;
    metadata: string[];
}

const StyledTreeItem = withStyles(({ palette, typography, breakpoints }: Theme) => ({
    iconContainer: {
        width: 25,
        marginLeft: 5,
        position: 'sticky',
        left: 10,
        [breakpoints.down('lg')]: {
            width: 15,
            marginLeft: 8,
        },
        '& .close': {
            opacity: 0.3
        },
    },
    root: {
        marginTop: 5,
    },
    group: {
        paddingLeft: 20,
        borderLeft: `1px dashed ${fade(palette.text.primary, 0.2)}`,
        [breakpoints.down('lg')]: {
            paddingLeft: 15,
        }
    },
    label: {
        fontSize: 16,
        fontWeight: typography.fontWeightLight,
        borderRadius: 5,
        padding: '5px 10px',
        [breakpoints.down('lg')]: {
            fontSize: 12,
            padding: '3px 6px',
        },
        backgroundColor: 'transparent !important',
        '&:hover': {
            backgroundColor: 'transparent',
        }
    },
    content: {
        backgroundColor: ({ color }: StyledTreeItemProps) => color,
        borderRadius: 5,
        transition: 'all 200ms ease',
        '&:hover': {
            transform: 'scale(1.01)',
            backgroundColor: ({ color }: StyledTreeItemProps) => fade(color, 0.4),
        }
    },
    selected: {
        backgroundColor: 'transparent'
    }
}))((props: TreeItemProps & StyledTreeItemProps) => <TreeItem {...props} label={<TreeLabel label={props.label} metadata={props.metadata} />} TransitionComponent={TransitionComponent} />);

interface TreeLabelProps {
    label?: React.ReactNode;
    metadata: string[];
}

const useTreeLabelStyles = makeStyles(({ breakpoints }) => ({
    label: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        position: 'sticky',
        left: 45,
        [breakpoints.down('lg')]: {
            left: 35,
        },
    }
}));

function TreeLabel(props: TreeLabelProps): React.ReactElement {
    const classes = useTreeLabelStyles();
    const { label, metadata } = props;

    return (
        <Box display='flex'>
            <Box className={classes.label}>{label}</Box>
            <MetadataView header={false} metadata={metadata} />
        </Box>
    );
}

const useMetadataStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    metadata: {
        display: 'flex',
        width: '50vw',
        [breakpoints.down('lg')]: {
            width: '42vw',
        }
    },
    column: {
        display: 'flex',
        alignItems: 'center',
        fontSize: ({ header }: MetadataViewProps) => header ? typography.pxToRem(18) : undefined,
        color: ({ header }: MetadataViewProps) => header ? palette.primary.dark : palette.grey[900],
        fontWeight: ({ header }: MetadataViewProps) => header ? typography.fontWeightRegular : typography.fontWeightLight,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        [breakpoints.down('lg')]: {
            fontSize: ({ header }: MetadataViewProps) => header ? typography.pxToRem(14) : undefined,
        }
    }
}));

interface MetadataViewProps {
    header: boolean;
    metadata: string[];
}

export function MetadataView(props: MetadataViewProps): React.ReactElement {
    const { metadata } = props;
    const classes = useMetadataStyles(props);
    const [unit, subjectId, itemName] = metadata;

    return (
        <Box className={classes.metadata}>
            <Tooltip title={unit}>
                <Box className={classes.column} component='div' whiteSpace='normal' width='8vw'>{unit}</Box>
            </Tooltip>
            <Tooltip title={subjectId}>
                <Box className={classes.column} width='15vw'>{trimmedMetadataField(subjectId, 25, 10)}</Box>
            </Tooltip>
            <Tooltip title={itemName}>
                <Box className={classes.column} ml={1} width='10vw'>{trimmedMetadataField(itemName, 15, 5)}</Box>
            </Tooltip>
        </Box>
    );
}

export default StyledTreeItem;
