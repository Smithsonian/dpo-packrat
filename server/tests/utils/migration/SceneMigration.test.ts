import * as DBAPI from '../../../db';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';
import { Config } from '../../../config';
import { SceneMigration, SceneMigrationResults } from '../../../utils/migration/SceneMigration';
// import { SceneMigrationPackage } from '../../../utils/migration/SceneMigrationPackage';
import { SceneMigrationPackages } from '../../../utils/migration/MigrationData';
import * as UTIL from '../../db/api';

import { AuthType, createClient, WebDAVClient, CreateReadStreamOptions } from 'webdav';
import { Readable } from 'stream';

afterAll(async done => {
    await H.Helpers.sleep(3000);
    done();
});

enum eTestType {
    eProductionMigration,
    eOneOff
}

const eTYPE: eTestType = +eTestType.eOneOff; // +eTestType.eProductionMigration; // + needed here so that compiler stops thinking eTYPE has a type of eTestType.eProductionMigration!
const sceneUserEmail: string = 'scenetest@si.edu';

describe('Utils > Migration: SceneMigration', () => {
    switch (eTYPE) {
        case eTestType.eProductionMigration:
            executeProductionMigration();
            break;
        case eTestType.eOneOff:
            executeOneOff();
            break;
    }
});

function executeProductionMigration(): void {
    let user: DBAPI.User | null = null;
    for (const scenePackage of SceneMigrationPackages) {
        test('Utils > Migration: SceneMigration', async () => {
            jest.setTimeout(1200000);

            if (!user)
                user = await fetchOrCreateTestUser();

            const SM: SceneMigration = new SceneMigration();
            const SMR: SceneMigrationResults = await SM.migrateScene(user.idUser, scenePackage, true);
            if (!SMR.success)
                LOG.error(`SceneMigration of ${H.Helpers.JSONStringify(scenePackage)} failed: ${SMR.error}`, LOG.LS.eTEST);
            else
                LOG.info(`SceneMigration of ${H.Helpers.JSONStringify(scenePackage)} succeeded: ${H.Helpers.JSONStringify(SMR)}`, LOG.LS.eTEST);
        });
    }
}

async function fetchOrCreateTestUser(): Promise<DBAPI.User> {
    const users: DBAPI.User[] | null = await DBAPI.User.fetchByEmail(sceneUserEmail);
    return (users && users.length > 0)
        ? users[0]
        : await UTIL.createUserTest({ Name: 'Scene Test', EmailAddress: sceneUserEmail, SecurityID: 'Scene Test', Active: true, DateActivated: UTIL.nowCleansed(), DateDisabled: null, WorkflowNotificationTime: UTIL.nowCleansed(), EmailSettings: 0, idUser: 0 });
}

function executeOneOff(): void {
    test('OneOff', async () => {
        try {
            // transmit file to Cook work folder via WebDAV
            const destination: string = 'http://si-3ddigip01.si.edu:8011/367d97ba-77de-476d-bf75-f265ffb31dc5/Loggerhead_Sea_Turtle-100k-2048_std.usdz';
            LOG.info(`Fetching ${destination}`, LOG.LS.eJOB);

            const webdavClient: WebDAVClient = createClient(Config.job.cookServerUrl, {
                authType: AuthType.None,
                maxBodyLength: 10 * 1024 * 1024 * 1024,
                withCredentials: false
            });
            const webdavWSOpts: CreateReadStreamOptions = {
                headers: { 'Content-Type': 'application/octet-stream' }
            };
            const readable: Readable = webdavClient.createReadStream(destination, webdavWSOpts);
            readable.on('error', _err => { LOG.error('fetchFile Error in stream handled', LOG.LS.eTEST); });
            LOG.info('fetchFile succeeded?', LOG.LS.eTEST);
            return;
        } catch (error) {
            LOG.error('fetchFile failed', LOG.LS.eTEST, error);
            return;
        }
    });
}