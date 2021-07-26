/* eslint-disable @typescript-eslint/no-explicit-any */
import { IJob } from './IJob';
import { IReport } from '../../report/interface';
import { eVocabularyID } from '../../cache/VocabularyCache';

export interface JobCreationParameters {
    idJob: number | null;               // Job ID              for job to start; either idJob or eJobType needs to be provided
    eJobType: eVocabularyID | null;     // Job type Vocab enum for job to start; either idJob or eJobType needs to be provided
    idAssetVersions: number[] | null;   // array of asset versions to be processed by this job; null for jobs not acting on assets
    report: IReport | null;             // report interface used for job status logging
    parameters: any;                    // job parameters; each Job should define their own job parameter interface
    frequency: string | null;           // job frequency: null means do not start; '' means run once, now; other strings describes a cron schedule (c.f. https://www.npmjs.com/package/node-schedule)
}

export interface IJobEngine {
    create(jobParams: JobCreationParameters): Promise<IJob | null>;
    jobCompleted(job: IJob): Promise<void>;
}
