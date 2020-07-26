import { gql } from 'apollo-server-express';

const getUnit = gql`
    query getUnit($input: GetUnitInput!) {
        getUnit(input: $input) {
            Unit {
                idUnit
            }
        }
    }
`;

export default getUnit;
