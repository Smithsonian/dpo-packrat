import { IStorage } from './IStorage';
import { LocalStorage } from '../impl';
import Config, { STORAGE_TYPE } from '../../config';

export class StorageFactory {
    private static instance: IStorage | null = null;

    static getInstance(): IStorage {
        /* istanbul ignore else */
        if (!StorageFactory.instance) {
            switch (Config.storage.type) {
                /* istanbul ignore next */
                default:
                case STORAGE_TYPE.LOCAL:
                    StorageFactory.instance = new LocalStorage();
                    break;
            }
        }
        return StorageFactory.instance;
    }
}
