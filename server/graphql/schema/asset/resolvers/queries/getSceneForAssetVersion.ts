import { QueryGetSceneForAssetVersionArgs, GetSceneForAssetVersionResult } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

export default async function getSceneForAssetVersion(_: Parent, args: QueryGetSceneForAssetVersionArgs,
    __: Context): Promise<GetSceneForAssetVersionResult> {
    const { idAssetVersion, directory } = args.input;
    const idScene = await fetchIdSceneFromIdAV(idAssetVersion);
    if (idScene === null) {
        RK.logError(RK.LogSection.eGQL,'get scene for asset version failed',`unexpected issue with fetching an idScene from idAssetVersion ${idAssetVersion}`,{ ...args.input },'GraphQL.Asset');
        return { idAssetVersion, SceneConstellation: null, success: false, message: 'An unexpected error occurred when trying to locate the scene' };
    }
    const SceneConstellation: DBAPI.SceneConstellation | null = await DBAPI.SceneConstellation.fetchFromAssetVersion(idAssetVersion, directory ?? undefined, idScene);
    if (!SceneConstellation)
        RK.logError(RK.LogSection.eGQL,'get scene for asset version failed',`unable to load SceneContellation from idAssetVersion ${idAssetVersion}`,{ ...args.input },'GraphQL.Asset');

    // LOG.info(`GraphQL getSceneForAssetVersion(${JSON.stringify(idAssetVersion)}) = ${JSON.stringify(JCOutput.Scene, H.Helpers.stringifyCallbackCustom)}`, LOG.LS.eGQL);
    return { idAssetVersion, SceneConstellation, success: true };
}

async function fetchIdSceneFromIdAV(idAssetVersion: number): Promise<number | undefined | null> {
    const AV = await DBAPI.AssetVersion.fetch(idAssetVersion);
    if (!AV) {
        RK.logError(RK.LogSection.eGQL,'get scene for asset version failed',`unable to fetch Asset Version idAssetVersion ${idAssetVersion}`,{},'GraphQL.Asset');
        return null;
    }
    const Asset = await DBAPI.Asset.fetch(AV.idAsset);
    if (!Asset) {
        RK.logError(RK.LogSection.eGQL,'fetch scene id from asset version failed',`unable to fetch Asset idAsset ${AV.idAsset}`,{ idAssetVersion },'GraphQL.Asset');
        return null;
    }
    // for fresh ingestions, it is expected that the asset is not linked to a SO
    // when this happens, we just return undefined
    if (!Asset.idSystemObject) return undefined;

    const SO = await DBAPI.SystemObject.fetch(Asset.idSystemObject);
    if (!SO) {
        RK.logError(RK.LogSection.eGQL,'fetch scene id from asset version failed',`unable to fetch SystemObject idSystemObject ${Asset.idSystemObject} from idAsset ${Asset.idAsset}`,{ idAssetVersion },'GraphQL.Asset');
        return null;
    }
    if (!SO.idScene) {
        RK.logError(RK.LogSection.eGQL,'fetch scene id from asset version failed',`idSystemObject ${Asset.idSystemObject} not associated with a scene`,{ idAssetVersion },'GraphQL.Asset');
    }
    return SO.idScene;
}