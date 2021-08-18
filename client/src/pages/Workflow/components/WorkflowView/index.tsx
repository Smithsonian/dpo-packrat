import React, { useEffect } from 'react';
import WorkflowFilter from './WorkflowFilter';
import WorkflowList from './WorkflowList';
import { useWorkflowStore } from '../../../../store/index';

function WorkflowView(): React.ReactElement {
    const fetchWorkflowList = useWorkflowStore(state => state.fetchWorkflowList);

    useEffect(() => {
        fetchWorkflowList();
    }, []);

    return (
        <React.Fragment>
            <WorkflowFilter />
            <WorkflowList />
        </React.Fragment>
    );
}

export default WorkflowView;
