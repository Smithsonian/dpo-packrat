/* eslint-disable @typescript-eslint/no-explicit-any */
import { IJob } from './IJob';
import { eVocabularyID } from '../../cache/VocabularyCache';

export interface IJobEngine {
    createByID(idJob: number, idAssetVersions: number[] | null, parameters: any, schedule: string | null): Promise<IJob | null>;
    createByType(eJobType: eVocabularyID, idAssetVersions: number[] | null, parameters: any, schedule: string | null): Promise<IJob | null>;
}
