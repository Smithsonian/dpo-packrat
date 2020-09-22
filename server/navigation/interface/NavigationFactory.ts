import { INavigation } from './INavigation';
import { NavigationDB } from '../impl';
import Config, { NAVIGATION_TYPE } from '../../config';
// import * as LOG from '../../utils/logger';

export class NavigationFactory {
    private static instance: INavigation | null = null;

    static async getInstance(): Promise<INavigation| null> {
        /* istanbul ignore else */
        if (!NavigationFactory.instance) {
            switch (Config.navigation.type) {
                /* istanbul ignore next */
                default:
                case NAVIGATION_TYPE.DB: {
                    NavigationFactory.instance = new NavigationDB();
                    break;
                }
            }
        }
        return NavigationFactory.instance;
    }
}
