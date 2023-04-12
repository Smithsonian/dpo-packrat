/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types, no-constant-condition */
import * as COMMON from '@dpo-packrat/common';

export class WorkflowJobParameters {
    eCookJob: COMMON.eVocabularyID;
    cookJobParameters: any;

    constructor(eCookJob: COMMON.eVocabularyID, cookJobParameters: any) {
        this.eCookJob = eCookJob;
        this.cookJobParameters = cookJobParameters;
    }
}
