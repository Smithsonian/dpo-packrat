import { gql } from 'apollo-server-express';

const getProject = gql`
    query getProject($input: GetProjectInput!) {
        getProject(input: $input) {
            Project {
                idProject
            }
        }
    }
`;

export default getProject;
