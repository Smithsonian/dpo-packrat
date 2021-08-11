import React from 'react';
import WorkflowFilter from './WorkflowFilter';
import WorkflowList from './WorkflowList';

function WorkflowView(): React.ReactElement {
    return (
        <React.Fragment>
            <WorkflowFilter />
            <WorkflowList />
        </React.Fragment>
    );
}

export default WorkflowView;
