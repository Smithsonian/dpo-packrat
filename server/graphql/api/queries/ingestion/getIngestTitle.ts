import { gql } from 'apollo-server-express';

const getIngestTitle = gql`
    query getIngestTitle($input: GetIngestTitleInput!) {
        getIngestTitle(input: $input) {
            ingestTitle {
                title
                forced
                subtitle
            }
        }
    }
`;

export default getIngestTitle;
