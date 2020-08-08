import { gql } from 'apollo-server-express';

const searchIngestionSubjects = gql`
    query searchIngestionSubjects($input: SearchIngestionSubjectsInput!) {
        searchIngestionSubjects(input: $input) {
            Subject {
                idSubject
            }
        }
    }
`;

export default searchIngestionSubjects;
