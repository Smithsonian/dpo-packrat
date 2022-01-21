import { QueryGetModelConstellationForAssetVersionArgs, GetModelConstellationForAssetVersionResult } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { JobCookSIPackratInspectOutput } from '../../../../../job/impl/Cook/JobCookSIPackratInspect';
import * as LOG from '../../../../../utils/logger';
// import * as H from '../../../../../utils/helpers';

export default async function getModelConstellationForAssetVersion(_: Parent, args: QueryGetModelConstellationForAssetVersionArgs,
    __: Context): Promise<GetModelConstellationForAssetVersionResult> {
    const { idAssetVersion } = args.input;

    const JCOutput: JobCookSIPackratInspectOutput | null = await JobCookSIPackratInspectOutput.extractFromAssetVersion(idAssetVersion);
    if (!JCOutput || !JCOutput.success) {
        LOG.error(`getModelConstellationForAssetVersion failed extracting job output: ${JCOutput ? JCOutput.error : ''}`, LOG.LS.eGQL);
        return { idAssetVersion };
    }

    // LOG.info(`GraphQL getModelConstellationForAssetVersion(${JSON.stringify(idAssetVersion)}) = ${JSON.stringify(JCOutput.modelConstellation, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
    return { idAssetVersion, ModelConstellation: JCOutput.modelConstellation };
}
