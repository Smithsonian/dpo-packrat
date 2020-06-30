import { gql } from 'apollo-server-express';

const createProject = gql`
    query createProject($input: CreateProjectInput!) {
        createProject(input: $input) {
            Project {
                idProject
            }
        }
    }
`;

export default createProject;
