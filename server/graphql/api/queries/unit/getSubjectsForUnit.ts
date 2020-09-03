import { gql } from 'apollo-server-express';

const getSubjectsForUnit = gql`
    query getSubjectsForUnit($input: GetSubjectsForUnitInput!) {
        getSubjectsForUnit(input: $input) {
            Subject {
                idSubject
                Name
            }
        }
    }
`;

export default getSubjectsForUnit;
