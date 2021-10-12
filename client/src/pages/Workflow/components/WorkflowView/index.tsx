/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from 'react';
import WorkflowFilter from './WorkflowFilter';
import WorkflowList from './WorkflowList';
import { useWorkflowStore } from '../../../../store/index';
import { Helmet } from 'react-helmet';

function WorkflowView(): React.ReactElement {
    const fetchWorkflowList = useWorkflowStore(state => state.fetchWorkflowList);

    useEffect(() => {
        fetchWorkflowList();
    }, []);

    return (
        <React.Fragment>
            <Helmet>
                <title>Workflow</title>
            </Helmet>
            <WorkflowFilter />
            <WorkflowList />
        </React.Fragment>
    );
}

export default WorkflowView;
