import { gql } from 'apollo-server-express';

const getWorkflowList = gql`
    query getWorkflowList($input: GetWorkflowListInput!) {
        getWorkflowList(input: $input) {
            WorkflowList {
                idWorkflow
                idWorkflowSet
                idWorkflowReport
                idJobRun
                Type
                State
                Owner {
                    Name
                }
                DateStart
                DateLast
                Error
                ProjectName
            }
        }
    }
`;

export default getWorkflowList;
