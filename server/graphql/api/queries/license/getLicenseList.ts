import { gql } from 'apollo-server-express';

const getLicenseList = gql`
    query getLicenseList($input: GetLicenseListInput!) {
        getLicenseList(input: $input) {
            Licenses {
                idLicense
                Description
                Name
            }
        }
    }
`;

export default getLicenseList;