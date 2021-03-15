import { IJobEngine } from './IJobEngine';
import { JobEngine } from '../impl/NS';
import { JOB_TYPE } from '../../config';
// import * as LOG from '../../utils/logger';

export class JobFactory {
    private static instance: IJobEngine | null = null;

    static async getInstance(eJobType: JOB_TYPE): Promise<IJobEngine | null> {
        /* istanbul ignore else */
        if (!JobFactory.instance) {
            switch (eJobType) {
                /* istanbul ignore next */
                default:
                case JOB_TYPE.NODE_SCHEDULE: {
                    JobFactory.instance = new JobEngine();
                    break;
                }
            }
        }
        return JobFactory.instance;
    }
}
