import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as H from '../utils/helpers';
import * as DBC from '../db/connection';

const TEST_STORAGE_ROOT: string = path.join(os.tmpdir(), 'packrat-test');

export async function teardown(): Promise<void> {
    await DBC.DBConnection.disconnect();
    await H.Helpers.sleep(1000);
    fs.rmSync(TEST_STORAGE_ROOT, { recursive: true, force: true });
}

module.exports = teardown;
