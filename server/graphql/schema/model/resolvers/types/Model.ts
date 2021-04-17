/**
 * Type resolver for Model
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Model = {
    ModelConstellation: async (parent: Parent): Promise<DBAPI.ModelConstellation | null> => {
        return await DBAPI.ModelConstellation.fetch(parent.idModel);
    },
    VCreationMethod: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVCreationMethod);
    },
    VModality: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVModality);
    },
    VPurpose: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVPurpose);
    },
    VUnits: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVUnits);
    },
    VFileType: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVFileType);
    },
    AssetThumbnail: async (parent: Parent): Promise<DBAPI.Asset | null> => {
        return await DBAPI.Asset.fetch(parent.idAssetThumbnail);
    },
    ModelObject: async (parent: Parent): Promise<DBAPI.ModelObject[] | null> => {
        return await DBAPI.ModelObject.fetchFromModel(parent.idModel);
    },
    ModelProcessingAction: async (parent: Parent): Promise<DBAPI.ModelProcessingAction[] | null> => {
        return await DBAPI.ModelProcessingAction.fetchFromModel(parent.idModel);
    },
    ModelSceneXref: async (parent: Parent): Promise<DBAPI.ModelSceneXref[] | null> => {
        return await DBAPI.ModelSceneXref.fetchFromModel(parent.idModel);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromModelID(parent.idModel);
    }
};

export default Model;
