import { QueryGetModelConstellationForAssetVersionArgs, GetModelConstellationForAssetVersionResult } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { JobCookSIPackratInspectOutput } from '../../../../../job/impl/Cook/JobCookSIPackratInspect';
// import * as H from '../../../../../utils/helpers';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

export default async function getModelConstellationForAssetVersion(_: Parent, args: QueryGetModelConstellationForAssetVersionArgs,
    __: Context): Promise<GetModelConstellationForAssetVersionResult> {
    const { idAssetVersion } = args.input;

    const JCOutput: JobCookSIPackratInspectOutput | null = await JobCookSIPackratInspectOutput.extractFromAssetVersion(idAssetVersion);
    if (!JCOutput || !JCOutput.success) {
        RK.logError(RK.LogSection.eGQL,'get model constellation for asset version failed',`failed extracting job output: ${JCOutput ? JCOutput.error : 'unknown error'}`,{ ...args.input },'GraphQL.Asset');
        return { idAssetVersion };
    }

    // LOG.info(`GraphQL getModelConstellationForAssetVersion(${JSON.stringify(idAssetVersion)}) = ${JSON.stringify(JCOutput.modelConstellation, H.Helpers.saferStringify)}`, LOG.LS.eGQL);
    return { idAssetVersion, ModelConstellation: JCOutput.modelConstellation };
}
