import { gql } from 'apollo-server-express';

const getObjectsForItem = gql`
    query getObjectsForItem($input: GetObjectsForItemInput!) {
        getObjectsForItem(input: $input) {
            CaptureData {
                idCaptureData
                DateCaptured
                Description
            }

            Model {
                idModel
                Authoritative
                DateCreated
            }

            Scene {
                idScene
                HasBeenQCd
                IsOriented
                Name
            }

            IntermediaryFile {
                idIntermediaryFile
                DateCreated
            }

            ProjectDocumentation {
                idProjectDocumentation
                Description
                Name
            }
        }
    }
`;

export default getObjectsForItem;
