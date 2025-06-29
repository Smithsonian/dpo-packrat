import { IStorage } from './IStorage';
import { LocalStorage } from '../impl';
import { IOResults } from '../../utils/helpers';
import { Config, STORAGE_TYPE } from '../../config';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class StorageFactory {
    private static instance: IStorage | null = null;

    static async getInstance(): Promise<IStorage| null> {
        /* istanbul ignore else */
        if (!StorageFactory.instance) {
            switch (Config.storage.type) {
                /* istanbul ignore next */
                default:
                case STORAGE_TYPE.LOCAL: {
                    const LS: LocalStorage = new LocalStorage();
                    const IOR: IOResults = await LS.initialize(Config.storage.rootRepository, Config.storage.rootStaging);
                    /* istanbul ignore else */
                    if (IOR.success===true) {
                        StorageFactory.instance = LS;
                        RK.logInfo(RK.LogSection.eSTR,'system initialize success',undefined,{ type: 'LocalStore' },'Storage.Factory');
                    } else {
                        RK.logError(RK.LogSection.eSTR,'system initialize failed',IOR.error,{ type: 'LocalStore' },'Storage.Factory');
                    }
                    break;
                }
            }
        }
        return StorageFactory.instance;
    }
}
