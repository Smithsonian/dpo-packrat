import { gql } from 'apollo-server-express';

const createSubject = gql`
    query createSubject($input: CreateSubjectInput!) {
        createSubject(input: $input) {
            Subject {
                idSubject
            }
        }
    }
`;

export default createSubject;
