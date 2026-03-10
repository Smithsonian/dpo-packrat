import * as H from '../utils/helpers';
import * as DBC from '../db/connection';
import { NavigationFactory } from '../navigation/interface/NavigationFactory';

export async function teardown(): Promise<void> {
    NavigationFactory.cleanup();
    await DBC.DBConnection.disconnect();
    await H.Helpers.sleep(1000);
}

module.exports = teardown;