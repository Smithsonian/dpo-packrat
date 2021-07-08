import { gql } from 'apollo-server-express';

const getLicense = gql`
    query getLicense($input: GetLicenseInput!) {
        getLicense(input: $input) {
            License {
                idLicense
                Description
                Name
                RestrictLevel
            }
        }
    }
`;

export default getLicense;
