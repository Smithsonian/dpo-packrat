import Job from './types/Job';
import JobRun from './types/JobRun';
import Workflow from './types/Workflow';
import WorkflowStep from './types/WorkflowStep';
import WorkflowStepSystemObjectXref from './types/WorkflowStepSystemObjectXref';
import getWorkflow from './queries/getWorkflow';

const resolvers = {
    Query: {
        getWorkflow
    },
    Job,
    JobRun,
    Workflow,
    WorkflowStep,
    WorkflowStepSystemObjectXref
};

export default resolvers;
