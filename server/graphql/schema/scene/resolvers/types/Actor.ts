/**
 * Type resolver for Actor
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Actor = {
    Unit: async (parent: Parent): Promise<DBAPI.Unit | null> => {
        return await DBAPI.Unit.fetch(parent.idUnit);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromActorID(parent.idActor);
    }
};

export default Actor;
