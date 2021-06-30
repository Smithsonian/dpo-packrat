import { gql } from 'apollo-server-express';

const createGeoLocation = gql`
    mutation createGeoLocation($input: CreateGeoLocationInput!) {
        createGeoLocation(input: $input) {
            GeoLocation {
                idGeoLocation
            }
        }
    }
`;

export default createGeoLocation;
