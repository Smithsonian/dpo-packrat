import { QueryGetSceneForAssetVersionArgs, GetSceneForAssetVersionResult } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function getSceneForAssetVersion(_: Parent, args: QueryGetSceneForAssetVersionArgs,
    __: Context): Promise<GetSceneForAssetVersionResult> {
    const { idAssetVersion } = args.input;

    const SceneConstellation: DBAPI.SceneConstellation | null = await DBAPI.SceneConstellation.fetchFromAssetVersion(idAssetVersion);
    if (!SceneConstellation)
        LOG.error(`getSceneForAssetVersion unable to load SceneContellation from idAssetVersion ${idAssetVersion}`, LOG.LS.eGQL);

    // LOG.info(`GraphQL getSceneForAssetVersion(${JSON.stringify(idAssetVersion)}) = ${JSON.stringify(JCOutput.Scene, H.Helpers.stringifyCallbackCustom)}`, LOG.LS.eGQL);
    return { idAssetVersion, SceneConstellation };
}
