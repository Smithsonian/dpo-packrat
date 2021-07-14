import { gql } from 'apollo-server-express';

const clearLicenseAssignment = gql`
    mutation clearLicenseAssignment($input: ClearLicenseAssignmentInput!) {
        clearLicenseAssignment(input: $input) {
            success
            message
        }
    }
`;

export default clearLicenseAssignment;
