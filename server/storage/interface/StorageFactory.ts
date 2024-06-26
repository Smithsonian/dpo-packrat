import { IStorage } from './IStorage';
import { LocalStorage } from '../impl';
import { IOResults } from '../../utils/helpers';
import { Config, STORAGE_TYPE } from '../../config';
import * as LOG from '../../utils/logger';

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
                    if (IOR.success)
                        StorageFactory.instance = LS;
                    else
                        LOG.error(`Error encountered in StorageFactory.getInstance while initializing LocalStorage: ${IOR.error}`, LOG.LS.eSTR);
                    break;
                }
            }
        }
        return StorageFactory.instance;
    }
}
