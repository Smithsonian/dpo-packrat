import { gql } from 'apollo-server-express';

const getScene = gql`
    query getScene($input: GetSceneInput!) {
        getScene(input: $input) {
            Scene {
                idScene
            }
        }
    }
`;

export default getScene;
