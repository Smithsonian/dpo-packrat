import Workflow from './types/Workflow';
import WorkflowStep from './types/WorkflowStep';
import WorkflowStepSystemObjectXref from './types/WorkflowStepSystemObjectXref';
import WorkflowTemplate from './types/WorkflowTemplate';
import getWorkflow from './queries/getWorkflow';

const resolvers = {
    Query: {
        getWorkflow
    },
    Workflow,
    WorkflowStep,
    WorkflowStepSystemObjectXref,
    WorkflowTemplate
};

export default resolvers;
