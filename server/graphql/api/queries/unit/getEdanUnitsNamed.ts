import { gql } from 'apollo-server-express';

const getEdanUnitsNamed = gql`
    query getEdanUnitsNamed {
        getEdanUnitsNamed {
            UnitEdan {
                idUnitEdan
                Name
                Abbreviation
                idUnit
            }
        }
    }
`;

export default getEdanUnitsNamed;
