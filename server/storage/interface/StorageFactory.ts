import { LocalStorage } from '../impl';
import Config, { STORAGE_TYPE } from '../../config';

class StorageFactory {
    private static instance: IStorage = null;

    static getInstance(): IStorage {
        if (!StorageFactory.instance) {
            switch (Config.storage.type) {
                default:
                case STORAGE_TYPE.LOCAL:
                    StorageFactory.instance = new LocalStorage();
                    break;
            }
        }
        return StorageFactory.instance;
    }
}

export default StorageFactory;
