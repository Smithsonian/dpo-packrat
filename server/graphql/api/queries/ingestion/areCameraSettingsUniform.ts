import { gql } from 'apollo-server-express';

const areCameraSettingsUniform = gql`
    query areCameraSettingsUniform($input: AreCameraSettingsUniformInput!) {
        areCameraSettingsUniform(input: $input) {
            isUniform
        }
    }
`;

export default areCameraSettingsUniform;
