import { gql } from 'apollo-server-express';

const createProject = gql`
    mutation createProject($input: CreateProjectInput!) {
        createProject(input: $input) {
            Project {
                idProject
            }
        }
    }
`;

export default createProject;
