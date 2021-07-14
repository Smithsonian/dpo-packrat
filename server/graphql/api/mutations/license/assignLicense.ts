import { gql } from 'apollo-server-express';

const assignLicense = gql`
    mutation assignLicense($input: AssignLicenseInput!) {
        assignLicense(input: $input) {
            success
            message
        }
    }
`;

export default assignLicense;
