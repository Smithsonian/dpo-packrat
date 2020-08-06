import { ICollection } from './ICollection';
import { EdanCollection } from '../impl';
import Config, { COLLECTION_TYPE } from '../../config';

export class CollectionFactory {
    private static instance: ICollection;

    static getInstance(): ICollection {
        if (!CollectionFactory.instance) {
            switch (Config.collection.type) {
                default:
                case COLLECTION_TYPE.EDAN:
                    CollectionFactory.instance = new EdanCollection();
                    break;
            }
        }
        return CollectionFactory.instance;
    }
}
