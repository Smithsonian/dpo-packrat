import { gql } from 'apollo-server-express';

const createUnit = gql`
    query createUnit($input: CreateUnitInput!) {
        createUnit(input: $input) {
            Unit {
                idUnit
            }
        }
    }
`;

export default createUnit;
