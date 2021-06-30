import { gql } from 'apollo-server-express';

const updateLicense = gql`
    mutation updateLicense($input: UpdateLicenseInput!) {
        updateLicense(input: $input) {
            License {
                idLicense
                Name
                Description
            }
        }
    }
`;

export default updateLicense;