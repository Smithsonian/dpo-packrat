import { gql } from 'apollo-server-express';

const getWorkflow = gql`
    query getWorkflow($input: GetWorkflowInput!) {
        getWorkflow(input: $input) {
            Workflow {
                idWorkflow
            }
        }
    }
`;

export default getWorkflow;
