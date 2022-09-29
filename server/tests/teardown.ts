import * as LOG from '../utils/logger';
import * as H from '../utils/helpers';

export async function teardown(): Promise<void> {
    LOG.end();
    await H.Helpers.sleep(2000);
}

module.exports = teardown;