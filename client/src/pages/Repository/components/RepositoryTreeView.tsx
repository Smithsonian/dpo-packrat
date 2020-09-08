import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { TreeView } from '@material-ui/lab';
import { BsChevronDown, BsChevronRight } from 'react-icons/bs';
import UnitTreeNode from './UnitTreeNode';
import StyledTreeItem from './StyledTreeItem';
import TreeViewContents, { RepositoryContentType } from './TreeViewContents';
import mockRepositoryData from '../mock.repository';

const { units } = mockRepositoryData;

const useStyles = makeStyles({
    container: {
        height: '85vh',
        flexGrow: 1,
        maxWidth: '60%',
        overflow: 'auto'
    }
});

export default function RepositoryTreeView(): React.ReactElement {
    const classes = useStyles();

    return (
        <TreeView
            className={classes.container}
            defaultCollapseIcon={<BsChevronDown />}
            defaultExpandIcon={<BsChevronRight />}
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
            label='Projects'
        >
            <TreeViewContents loading={loading} isEmpty contentType={RepositoryContentType.projects}>
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
            label='Units'
        >
            <TreeViewContents loading={loading} isEmpty={!units.length} contentType={RepositoryContentType.units}>
                {units.map(({ idUnit, Name }, index) => <UnitTreeNode key={index} idUnit={idUnit} Name={Name} />)}
            </TreeViewContents>
        </StyledTreeItem>
    );
}
