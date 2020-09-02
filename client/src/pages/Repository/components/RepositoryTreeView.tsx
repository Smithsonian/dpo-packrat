import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { TreeView } from '@material-ui/lab';
import { BsChevronDown, BsChevronRight } from 'react-icons/bs';
import { AiOutlineFileZip } from 'react-icons/ai';
import UnitTreeNode from './UnitTreeNode';
import StyledTreeItem from './StyledTreeItem';
import TreeViewContents from './TreeViewContents';

const useStyles = makeStyles({
    root: {
        height: 260,
        flexGrow: 1,
        maxWidth: '90%'
    }
});

export default function RepositoryTreeView(): React.ReactElement {
    const classes = useStyles();

    return (
        <TreeView
            className={classes.root}
            defaultCollapseIcon={<BsChevronDown />}
            defaultExpandIcon={<BsChevronRight />}
            defaultEndIcon={<AiOutlineFileZip />}
        >
            <ProjectTreeRoot />
            <UnitTreeRoot />
        </TreeView>
    );
}

function ProjectTreeRoot(): React.ReactElement {
    const [loading, setLoading] = useState(true);
    console.log('loading project root');

    const loadData = () => {
        setTimeout(() => {
            setLoading(false);
        }, 2000);
    };

    return (
        <StyledTreeItem
            onLabelClick={loadData}
            onIconClick={loadData}
            nodeId='project-root'
            label='Project'
        >
            <TreeViewContents loading={loading}>
            </TreeViewContents>
        </StyledTreeItem>
    );
}

function UnitTreeRoot(): React.ReactElement {
    const [loading, setLoading] = useState(true);

    const loadData = () => {
        console.log('Loading units');
        setTimeout(() => {
            setLoading(false);
        }, 2000);
    };

    return (
        <StyledTreeItem
            onLabelClick={loadData}
            onIconClick={loadData}
            nodeId='unit-root'
            label='Unit'
        >
            <TreeViewContents loading={loading}>
                <UnitTreeNode idUnit={1} />
                <UnitTreeNode idUnit={2} />
                <UnitTreeNode idUnit={3} />
                <UnitTreeNode idUnit={4} />
            </TreeViewContents>
        </StyledTreeItem>
    );
}
