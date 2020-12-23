import { gql } from 'apollo-server-express';

const getFilterViewData = gql`
    query getFilterViewData {
        getFilterViewData {
            units {
              idUnit
              Name
              SystemObject {
                idSystemObject
              }
            }
            projects {
              idProject
              Name
              SystemObject {
                idSystemObject
              }
            }
        }
    }
`;

export default getFilterViewData;
