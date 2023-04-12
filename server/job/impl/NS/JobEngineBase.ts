/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import { eEventKey } from '../../../event/interface';

export abstract class JobEngineBase {
    abstract sendJobEvent(idJobRun: number, obj: any, key: eEventKey): Promise<boolean>;
}
