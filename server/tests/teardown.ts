import * as LOG from '../utils/logger';
import * as H from '../utils/helpers';
// import * as DBC from '../db/connection';

export async function teardown(): Promise<void> {
    // await DBC.DBConnection.disconnect();
    LOG.end();
    await H.Helpers.sleep(1000);
}

module.exports = teardown;