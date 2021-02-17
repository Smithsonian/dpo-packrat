import { INavigation } from './INavigation';
import { NavigationDB } from '../impl';
import { NavigationSolr } from '../impl/NavigationSolr';
import Config, { NAVIGATION_TYPE } from '../../config';
// import * as LOG from '../../utils/logger';

export class NavigationFactory {
    private static instance: INavigation | null = null;

    static async getInstance(eNavType: NAVIGATION_TYPE = NAVIGATION_TYPE.DEFAULT): Promise<INavigation| null> {
        if (eNavType == NAVIGATION_TYPE.DEFAULT)
            eNavType = Config.navigation.type;

        /* istanbul ignore else */
        if (!NavigationFactory.instance) {
            switch (eNavType) {
                /* istanbul ignore next */
                default:
                case NAVIGATION_TYPE.DB: {
                    NavigationFactory.instance = new NavigationDB();
                    break;
                }
                case NAVIGATION_TYPE.SOLR: {
                    NavigationFactory.instance = new NavigationSolr();
                    break;
                }
            }
        }
        return NavigationFactory.instance;
    }
}
