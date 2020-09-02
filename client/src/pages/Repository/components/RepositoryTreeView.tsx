import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { TreeView } from '@material-ui/lab';
import { BsChevronDown, BsChevronRight } from 'react-icons/bs';
import { AiOutlineFileZip } from 'react-icons/ai';
import UnitRepositoryTree from './UnitRepositoryTree';

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
            <UnitRepositoryTree idUnit={1} />
            <UnitRepositoryTree idUnit={2} />
            <UnitRepositoryTree idUnit={3} />
            <UnitRepositoryTree idUnit={4} />
        </TreeView>
    );
}