import { gql } from 'apollo-server-express';

const createProject = gql`
    mutation createProject($input: CreateProjectInput!) {
        createProject(input: $input) {
            Project {
                idProject
                SystemObject {
                    idSystemObject
                }
            }
        }
    }
`;

export default createProject;
