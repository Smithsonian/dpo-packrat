import * as WF from '../../interface';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as LOG from '../../../utils/logger';

export class WorkflowJobParameters {
    eCookJob: CACHE.eVocabularyID;
    constructor(eCookJob: CACHE.eVocabularyID) {
        this.eCookJob = eCookJob;
    }
}

export class WorkflowJob implements WF.IWorkflow {
    async start(workflowParams: WF.WorkflowParameters): Promise<boolean> {
        if (!await this.validateParameters(workflowParams))
            return false;

        // fetch IJobEngine; use IJobEngine to create IJob; use IJob to start job
        // expect job to update WorkflowStep
        return true;
    }

    private async validateParameters(workflowParams: WF.WorkflowParameters): Promise<boolean> {
        // confirm that workflowParams.parameters is valid
        if (!(workflowParams.parameters instanceof WorkflowJobParameters)) {
            LOG.logger.error(`WorkflowJob.start called with parameters not of type WorkflowJobParameters: ${JSON.stringify(workflowParams.parameters)}`);
            return false;
        }

        // confirm job type is a really a Job type
        const eJobType: CACHE.eVocabularyID = workflowParams.parameters.eCookJob;
        if (!await CACHE.VocabularyCache.isVocabularyInSet(eJobType, CACHE.eVocabularySetID.eJobJobType)) {
            LOG.logger.error(`WorkflowJob.start called with parameters not of type WorkflowJobParameters: ${JSON.stringify(workflowParams.parameters)}`);
            return false;
        }

        // confirm that workflowParams.idSystemObject are asset versions; ultimately, we will want to allow a model and/or capture data, depending on the recipe
        if (!workflowParams.idSystemObject)
            return true; // OK to call without objects to act on, at least at this point -- the job itself may complain once started

        for (const idSystemObject of workflowParams.idSystemObject) {
            const OID: CACHE.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
            if (!OID) {
                LOG.logger.error(`WorkflowJob.start unable to compute system object type for ${idSystemObject}`);
                return false;
            } else if (OID.eObjectType != DBAPI.eSystemObjectType.eAssetVersion) {
                LOG.logger.error(`WorkflowJob.start called with invalid system object type ${JSON.stringify(OID)} for ${idSystemObject}; expected eAssetVersion`);
                return false;
            }
        }
        return true;
    }
}