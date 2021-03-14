/* eslint-disable @typescript-eslint/no-explicit-any */
import { IJob } from './IJob';
import { eVocabularyID } from '../../cache/VocabularyCache';

export enum eJobStatus {
    eActive,
    eInactive,
    eTest,
}

export interface IJobEngine {
    createByID(idJob: number, parameters: any, schedule: string | null): Promise<IJob | null>;
    createByType(eJobType: eVocabularyID, parameters: any, schedule: string | null): Promise<IJob | null>;
}
