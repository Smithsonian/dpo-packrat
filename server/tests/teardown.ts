import * as fs from 'fs';
import * as H from '../utils/helpers';
import * as DBC from '../db/connection';
import { sandboxPaths } from './sandboxPaths';

export async function teardown(): Promise<void> {
    await DBC.DBConnection.disconnect();
    await H.Helpers.sleep(1000);
    // Remove the storage sandboxes but KEEP the logs subdir so a run's output
    // survives for inspection (CI uploads it on failure).
    const SB = sandboxPaths();
    for (const dir of [SB.repository, SB.staging, SB.edanStaging])
        fs.rmSync(dir, { recursive: true, force: true });
}

module.exports = teardown;
