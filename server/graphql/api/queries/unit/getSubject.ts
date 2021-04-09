import { gql } from 'apollo-server-express';

const getSubject = gql`
    query getSubject($input: GetSubjectInput!) {
        getSubject(input: $input) {
            Subject {
                idSubject
                SystemObject {
                    idSystemObject
                }
            }
        }
    }
`;

export default getSubject;
