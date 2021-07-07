import { gql } from 'apollo-server-express';

const createLicense = gql`
    mutation createLicense($input: CreateLicenseInput!) {
        createLicense(input: $input) {
            License {
                idLicense
                Name
                Description
            }
        }
    }
`;

export default createLicense;