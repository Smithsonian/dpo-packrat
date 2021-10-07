/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from 'react';
import WorkflowFilter from './WorkflowFilter';
import WorkflowList from './WorkflowList';
import { useWorkflowStore } from '../../../../store/index';
import { Helmet } from 'react-helmet';
import { getHeaderTitle } from '../../../../utils/shared';

function WorkflowView(): React.ReactElement {
    const fetchWorkflowList = useWorkflowStore(state => state.fetchWorkflowList);

    useEffect(() => {
        fetchWorkflowList();
    }, []);
    const title = getHeaderTitle('Workflow');

    return (
        <React.Fragment>
            <Helmet>
                <title>{title}</title>
            </Helmet>
            <WorkflowFilter />
            <WorkflowList />
        </React.Fragment>
    );
}

export default WorkflowView;
