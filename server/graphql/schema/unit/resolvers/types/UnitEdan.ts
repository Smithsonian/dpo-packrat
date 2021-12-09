/**
 * Type resolver for Unit
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const UnitEdan = {
    Unit: async (parent: Parent): Promise<DBAPI.Unit | null> => {
        return await DBAPI.Unit.fetch(parent.idUnit);
    }
};

export default UnitEdan;
