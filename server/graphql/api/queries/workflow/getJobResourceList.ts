import { gql } from 'apollo-server-express';

const getJobResourceList = gql`
    query getJobResourceList($input: GetJobResourceListInput!) {
        getJobResourceList(input: $input) {
            JobResourceList {
                name
                type
                address
                port
                canInspect
                canSceneGen
                canPhotogrammetry
                canBigFile
            }
        }
    }
`;

export default getJobResourceList;