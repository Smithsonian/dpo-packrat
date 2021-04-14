import { QueryGetModelConstellationForAssetVersionArgs, GetModelConstellationForAssetVersionResult } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as LOG from '../../../../../utils/logger';
import { JobCookSIPackratInspectOutput } from '../../../../../job/impl/Cook/JobCookSIPackratInspect';


export default async function getModelConstellationForAssetVersion(_: Parent, args: QueryGetModelConstellationForAssetVersionArgs,
    __: Context): Promise<GetModelConstellationForAssetVersionResult> {
    const { idAssetVersion } = args.input;

    const JCOutput: JobCookSIPackratInspectOutput | null = await JobCookSIPackratInspectOutput.extractFromAssetVersion(idAssetVersion);
    if (!JCOutput || !JCOutput.success) {
        LOG.logger.error(`getModelConstellationForAssetVersion failed extracting job output: ${JCOutput ? JCOutput.error : ''}`);
        return { idAssetVersion };
    }

    // LOG.logger.info(`GraphQL getModelConstellationForAssetVersion(${JSON.stringify(idAssetVersion)}) = ${JSON.stringify(JCOutput.modelConstellation, H.Helpers.stringifyCallbackCustom)}`);
    return { idAssetVersion, ModelConstellation: JCOutput.modelConstellation };
}
