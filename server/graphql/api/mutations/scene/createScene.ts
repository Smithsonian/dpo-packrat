import { gql } from 'apollo-server-express';

const createScene = gql`
    mutation createScene($input: CreateSceneInput!) {
        createScene(input: $input) {
            Scene {
                idScene
            }
        }
    }
`;

export default createScene;
