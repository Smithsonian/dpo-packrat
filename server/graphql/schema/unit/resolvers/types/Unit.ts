/**
 * Type resolver for Unit
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Unit = {
    Subject: async (parent: Parent): Promise<DBAPI.Subject[] | null> => {
        return await DBAPI.Subject.fetchFromUnit(parent.idUnit);
    },
    Actor: async (parent: Parent): Promise<DBAPI.Actor[] | null> => {
        return await DBAPI.Actor.fetchFromUnit(parent.idUnit);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromUnitID(parent.idUnit);
    }
};

export default Unit;
