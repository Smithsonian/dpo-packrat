import { gql } from 'apollo-server-express';

const getIngestionProjectsForSubjects = gql`
    query getIngestionProjectsForSubjects($input: GetIngestionProjectsForSubjectsInput!) {
        getIngestionProjectsForSubjects(input: $input) {
            Project {
                idProject
                Name
            }
            Default
        }
    }
`;

export default getIngestionProjectsForSubjects;
