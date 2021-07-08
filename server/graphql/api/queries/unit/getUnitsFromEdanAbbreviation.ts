import { gql } from 'apollo-server-express';

const getUnitsFromEdanAbbreviation = gql`
    query getUnitsFromEdanAbbreviation($input: GetUnitsFromEdanAbbreviationInput!) {
        getUnitsFromEdanAbbreviation(input: $input) {
            Units {
                idUnit
                Name
            }
        }
    }
`;

export default getUnitsFromEdanAbbreviation;