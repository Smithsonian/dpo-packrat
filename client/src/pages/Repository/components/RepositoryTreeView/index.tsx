import { makeStyles } from '@material-ui/core/styles';
import { TreeView } from '@material-ui/lab';
import React from 'react';
import { BsChevronDown, BsChevronRight } from 'react-icons/bs';
import mockRepositoryData from '../../mock.repository';
import UnitTreeNode from './UnitTreeNode';
import { RepositoryFilter } from '../../index';

const { units } = mockRepositoryData;

const useStyles = makeStyles({
    container: {
        display: 'flex',
        flex: 1,
        maxHeight: '70vh',
        flexDirection: 'column',
        overflow: 'auto'
    }
});

interface RepositoryTreeViewProps {
    filter: RepositoryFilter;
}

function RepositoryTreeView(props: RepositoryTreeViewProps): React.ReactElement {
    const { filter } = props;
    const classes = useStyles();

    return (
        <TreeView
            className={classes.container}
            defaultCollapseIcon={<BsChevronDown />}
            defaultExpandIcon={<BsChevronRight />}
        >
            {filter.units && units.map(({ idUnit, Name }, index) => <UnitTreeNode key={index} idUnit={idUnit} Name={Name} />)}
        </TreeView>
    );
}

export default RepositoryTreeView;