import { gql } from 'apollo-server-express';

const getProjectList = gql`
    query getProjectList($input: GetProjectListInput!) {
        getProjectList(input: $input) {
            projects {
                idProject
                Name
                SystemObject {
                    idSystemObject
                }
            }
        }
    }
`;

export default getProjectList;