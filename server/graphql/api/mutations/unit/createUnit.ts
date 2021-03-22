import { gql } from 'apollo-server-express';

const createUnit = gql`
    mutation createUnit($input: CreateUnitInput!) {
        createUnit(input: $input) {
            Unit {
                idUnit
                SystemObject {
                    idSystemObject
                }
            }
        }
    }
`;

export default createUnit;
