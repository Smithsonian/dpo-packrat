import { QueryGetSceneForAssetVersionArgs, GetSceneForAssetVersionResult } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function getSceneForAssetVersion(_: Parent, args: QueryGetSceneForAssetVersionArgs,
    __: Context): Promise<GetSceneForAssetVersionResult> {
    const { idAssetVersion, directory } = args.input;
    const idScene = await fetchIdSceneFromIdAV(idAssetVersion);
    if (idScene === null) {
        LOG.error(`getSceneForAssetVersion experienced unexpected issue with fetching an idScene from idAssetVersion ${idAssetVersion}`, LOG.LS.eGQL);
        return { idAssetVersion, SceneConstellation: null, success: false, message: 'An unexpected error occurred when trying to locate the scene' };
    }
    const SceneConstellation: DBAPI.SceneConstellation | null = await DBAPI.SceneConstellation.fetchFromAssetVersion(idAssetVersion, directory ?? undefined, idScene);
    if (!SceneConstellation)
        LOG.error(`getSceneForAssetVersion unable to load SceneContellation from idAssetVersion ${idAssetVersion}`, LOG.LS.eGQL);

    // LOG.info(`GraphQL getSceneForAssetVersion(${JSON.stringify(idAssetVersion)}) = ${JSON.stringify(JCOutput.Scene, H.Helpers.stringifyCallbackCustom)}`, LOG.LS.eGQL);
    return { idAssetVersion, SceneConstellation, success: true };
}

async function fetchIdSceneFromIdAV(idAssetVersion: number): Promise<number | undefined | null> {
    const AV = await DBAPI.AssetVersion.fetch(idAssetVersion);
    if (!AV) {
        LOG.error(`fetchIdSceneFromIdAV unable to fetch Asset Version idAssetVersion ${idAssetVersion}`, LOG.LS.eGQL);
        return null;
    }
    const Asset = await DBAPI.Asset.fetch(AV.idAsset);
    if (!Asset) {
        LOG.error(`fetchIdSceneFromIdAV unable to fetch Asset idAsset ${AV.idAsset}`, LOG.LS.eGQL);
        return null;
    }
    // for fresh ingestions, it is expected that the asset is not linked to a SO
    // when this happens, we just return undefined
    if (!Asset.idSystemObject) return undefined;

    const SO = await DBAPI.SystemObject.fetch(Asset.idSystemObject);
    if (!SO) {
        LOG.error(`fetchIdSceneFromIdAV unable to fetch SystemObject idSystemObject ${Asset.idSystemObject} from idAsset ${Asset.idAsset}`, LOG.LS.eGQL);
        return null;
    }
    if (!SO.idScene) {
        LOG.error(`fetchIdSceneFromIdAV idSystemObject ${Asset.idSystemObject} not associated with a scene`, LOG.LS.eGQL);
    }
    return SO.idScene;
}