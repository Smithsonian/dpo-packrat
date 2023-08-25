import Job from './types/Job';
import JobRun from './types/JobRun';
import Workflow from './types/Workflow';
import WorkflowListResult from './types/WorkflowListResult';
import WorkflowReport from './types/WorkflowReport';
import WorkflowSet from './types/WorkflowSet';
import WorkflowStep from './types/WorkflowStep';
import WorkflowStepSystemObjectXref from './types/WorkflowStepSystemObjectXref';
import getWorkflow from './queries/getWorkflow';
import getWorkflowList from './queries/getWorkflowList';
// import getJobResourceList from './queries/getJobResourceList';

const resolvers = {
    Query: {
        getWorkflow,
        getWorkflowList,
        // getJobResourceList,
    },
    Job,
    JobRun,
    Workflow,
    WorkflowListResult,
    WorkflowReport,
    WorkflowSet,
    WorkflowStep,
    WorkflowStepSystemObjectXref
};

export default resolvers;
