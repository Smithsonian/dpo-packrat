import { QueryGetModelConstellationForAssetVersionArgs, GetModelConstellationForAssetVersionResult } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as LOG from '../../../../../utils/logger';
import { JobCookSIPackratInspectOutput } from '../../../../../job/impl/Cook/JobCookSIPackratInspect';


export default async function getModelConstellationForAssetVersion(_: Parent, args: QueryGetModelConstellationForAssetVersionArgs,
    context: Context): Promise<GetModelConstellationForAssetVersionResult> {
    const { user } = context;
    const { idAssetVersion } = args.input;
    if (!user)
        return { idAssetVersion };

    const JCOutput: JobCookSIPackratInspectOutput | null = await JobCookSIPackratInspectOutput.extractFromAssetVersion(idAssetVersion);
    if (!JCOutput || !JCOutput.success) {
        LOG.logger.error(`getModelConstellationForAssetVersion failed extracting job output: ${JCOutput ? JCOutput.error : ''}`);
        return { idAssetVersion };
    }

    // LOG.logger.info(`GraphQL getModelConstellationForAssetVersion(${JSON.stringify(idAssetVersions)}) = ${JSON.stringify(result)}`);
    return { idAssetVersion, ModelConstellation: JCOutput.modelConstellation };
}
