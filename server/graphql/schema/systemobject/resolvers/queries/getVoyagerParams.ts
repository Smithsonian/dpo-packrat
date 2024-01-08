/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import * as LOG from '../../../../../utils/logger';
import * as H from '../../../../../utils/helpers';
import { GetVoyagerParamsResult, QueryGetVoyagerParamsArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as COMMON from '@dpo-packrat/common';

export default async function getVoyagerParams(_: Parent, args: QueryGetVoyagerParamsArgs): Promise<GetVoyagerParamsResult> {
    const { input } = args;
    const { idSystemObject } = input;

    const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
    if (!oID)
        return logError(`getVoyagerParams unable to fetch object ID and type for ${idSystemObject}`);

    let SceneSO: DBAPI.SystemObjectInfo | undefined = undefined;
    switch (oID.eObjectType) {
        default:
            return logError(`getVoyagerParams called for unsupported object type ${COMMON.eSystemObjectType[oID.eObjectType]}`);

        case COMMON.eSystemObjectType.eScene: {
            const OIDT: DBAPI.SystemObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectAndSystemFromSystem(idSystemObject);
            if (!OIDT)
                return logError(`getVoyagerParams unable to fetch system object for scene with idSystemObject ${idSystemObject}`);
            SceneSO = OIDT.sID;
        } break;

        case COMMON.eSystemObjectType.eModel: { // Determine which scene, if any, to view for a model
            const model: DBAPI.Model | null = await DBAPI.Model.fetch(oID.idObject);
            if (!model)
                return logError(`getVoyagerParams unable to fetch model with id ${oID.idObject}`);

            let scenesToConsider: DBAPI.Scene[] | null = null;
            const eModelPurpose: COMMON.eVocabularyID | undefined = model.idVPurpose ?
                await CACHE.VocabularyCache.vocabularyIdToEnum(model.idVPurpose) : undefined;
            switch (eModelPurpose) {
                // Master model -> find newest scene that is derived from the model
                case COMMON.eVocabularyID.eModelPurposeMaster: {
                    scenesToConsider = await DBAPI.Scene.fetchChildrenScenes(model.idModel);
                    if (!scenesToConsider)
                        return logError(`getVoyagerParams unable to fetch children scenes of model ${H.Helpers.JSONStringify(model)}`);
                } break;

                // Voyager Model -> find newest scene that is the master of the model
                case COMMON.eVocabularyID.eModelPurposeVoyagerSceneModel: {
                    scenesToConsider = await DBAPI.Scene.fetchParentScenes(model.idModel);
                    if (!scenesToConsider)
                        return logError(`getVoyagerParams unable to fetch parent scenes of model ${H.Helpers.JSONStringify(model)}`);

                } break;

                // Other: first look for scene that is a source for this model, then look for scene that is derived from this model
                case COMMON.eVocabularyID.eModelPurposeDownload:
                case COMMON.eVocabularyID.eModelPurposeIntermediateProcessingStep:
                default:
                    scenesToConsider = await DBAPI.Scene.fetchParentScenes(model.idModel);
                    if (!scenesToConsider)
                        scenesToConsider = await DBAPI.Scene.fetchChildrenScenes(model.idModel);
                    break;
            }

            // if we have computed scenes to consider, pick the newest scene
            let selectedScene: DBAPI.Scene | null = null;
            if (scenesToConsider) {
                // pick newest scene (one with highest ID)
                for (const scene of scenesToConsider)
                    if ((selectedScene?.idScene ?? 0) < scene.idScene)
                        selectedScene = scene;
            }

            if (selectedScene) {
                SceneSO = await CACHE.SystemObjectCache.getSystemFromScene(selectedScene);
                if (!SceneSO)
                    return logError(`getVoyagerParams unable to fetch system object from scene ${H.Helpers.JSONStringify(selectedScene)}`);
            } else
                return log(true, `getVoyagerParams found no scene parents or children of model ${H.Helpers.JSONStringify(model)}`);

        } break;
    }

    if (!SceneSO)
        return logError(`getVoyagerParams unable to compute scene idSystemObject from input ${idSystemObject} mapped to ${H.Helpers.JSONStringify(oID)}`);

    const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchLatestFromSystemObject(SceneSO.idSystemObject);
    if (!assetVersions || assetVersions.length === 0)
        return logError(`getVoyagerParams retrieved no asset versions for scene with id ${SceneSO.idSystemObject}`);

    const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(SceneSO.idSystemObject);
    if (!SO)
        return logError(`getVoyagerParams unable to retrieve system object with ID ${SceneSO.idSystemObject}`);

    // Find the "preferred asset" for the scene -- namely, it's svx.json
    for (const assetVersion of assetVersions) {
        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
        if (!asset)
            return logError(`getVoyagerParams retrieved no asset from asset version ${H.Helpers.JSONStringify(assetVersion)}`);

        if (await CACHE.VocabularyCache.isPreferredAsset(asset.idVAssetType, SO))
            return { path: assetVersion.FilePath, document: assetVersion.FileName, idSystemObjectScene: SceneSO.idSystemObject };
    }
    log(false, `getVoyagerParams found no preferred assets for idSystemObject ${SceneSO.idSystemObject}`);
    return { path: assetVersions[0].FilePath, document: assetVersions[0].FileName, idSystemObjectScene: SceneSO.idSystemObject };
}

function logError(error: string): GetVoyagerParamsResult {
    return log(false, error);
}

function log(success: boolean, message: string): GetVoyagerParamsResult {
    if (success)
        LOG.info(`getVoyagerParams ${message}`, LOG.LS.eGQL);
    else
        LOG.error(`getVoyagerParams ${message}`, LOG.LS.eGQL);
    return { };
}