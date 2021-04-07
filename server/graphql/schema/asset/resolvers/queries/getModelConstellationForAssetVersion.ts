import { QueryGetModelConstellationForAssetVersionArgs, GetModelConstellationForAssetVersionResult } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { eJobRunStatus, JobRun } from '../../../../../db';
import * as CACHE from '../../../../../cache';
import * as LOG from '../../../../../utils/logger';
import { JobCookSIPackratInspectOutput } from '../../../../../job/impl/Cook/JobCookSIPackratInspect';


export default async function getModelConstellationForAssetVersion(_: Parent, args: QueryGetModelConstellationForAssetVersionArgs,
    context: Context): Promise<GetModelConstellationForAssetVersionResult> {
    const { user } = context;
    const { idAssetVersion } = args.input;
    if (!user)
        return { idAssetVersion };

    // find JobCook results for this asset version
    const idVJobType: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(CACHE.eVocabularyID.eJobJobTypeCookSIPackratInspect);
    if (!idVJobType) {
        LOG.logger.error('getModelConstellationForAssetVersion failed: unable to compute Job ID of si-packrat-inspect');
        return { idAssetVersion };
    }

    const jobRuns: JobRun[] | null = await JobRun.fetchMatching(1, idVJobType, eJobRunStatus.eDone, true, [idAssetVersion]);
    if (!jobRuns || jobRuns.length != 1) {
        LOG.logger.error(`getModelConstellationForAssetVersion failed: unable to compute Job Runs of si-packrat-inspect for asset version ${idAssetVersion}`);
        return { idAssetVersion };
    }

    let JCOutput: JobCookSIPackratInspectOutput | null = null;
    try {
        JCOutput = await JobCookSIPackratInspectOutput.extract(JSON.parse(jobRuns[0].Output || ''));
    } catch (error) {
        LOG.logger.error(`getModelConstellationForAssetVersion${JCOutput ? ' ' + JCOutput.error : ''}`, error);
        return { idAssetVersion };
    }

    if (!JCOutput.success) {
        LOG.logger.error(`getModelConstellationForAssetVersion failed extracting job output [${
            JCOutput.error}]: ${jobRuns[0].Output}`);
        return { idAssetVersion };
    }

    // LOG.logger.info(`GraphQL getModelConstellationForAssetVersion(${JSON.stringify(idAssetVersions)}) = ${JSON.stringify(result)}`);
    return { idAssetVersion, ModelConstellation: JCOutput.modelConstellation };
}
