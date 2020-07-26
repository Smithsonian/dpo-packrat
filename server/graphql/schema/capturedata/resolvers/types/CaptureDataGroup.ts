/**
 * Type resolver for CaptureDataGroup
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const CaptureDataGroup = {
    CaptureData: async (parent: Parent): Promise<DBAPI.CaptureData[] | null> => {
        return await DBAPI.CaptureData.fetchFromXref(parent.idCaptureDataGroup);
    }
};

export default CaptureDataGroup;
