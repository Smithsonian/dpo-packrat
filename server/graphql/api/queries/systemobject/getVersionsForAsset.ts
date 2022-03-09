import { gql } from 'apollo-server-express';

const getVersionsForAsset = gql`
    query getVersionsForAsset($input: GetVersionsForAssetInput!) {
        getVersionsForAsset(input: $input) {
          versions {
                idSystemObject
                idAssetVersion
                version
                name
                creator
                dateCreated
                size
                hash
                ingested
                Comment
                CommentLink
            }
        }
    }
`;

export default getVersionsForAsset;
