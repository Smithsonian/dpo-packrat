/**
 * Type resolver for AssetGroup
 */
import { AssetGroup } from '@prisma/client';
import { Parent  } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const AssetGroup = {
    Asset: async (parent: Parent): Promise<DBAPI.Asset[] | null> => {
        return await DBAPI.Asset.fetchFromAssetGroup(parent.idAssetGroup);
    }
};

export default AssetGroup;
