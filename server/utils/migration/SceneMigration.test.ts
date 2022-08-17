import * as DBAPI from '../../db';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';
import { SceneMigration, SceneMigrationResults } from '../../utils/migration/SceneMigration';
// import { SceneMigrationPackage } from '../../utils/migration/SceneMigrationPackage';
import { SceneMigrationPackages } from '../../utils/migration/MigrationData';
import * as UTIL from '../../tests/db/api';

afterAll(async done => {
    await H.Helpers.sleep(3000);
    done();
});

enum eTestType {
    eNone,
    eProductionMigration
}

const eTYPE: eTestType = +eTestType.eProductionMigration; // + needed here so that compiler stops thinking eTYPE has a type of eTestType.eProductionMigration!
const sceneUserEmail: string = 'tysonj@si.edu';

describe('Utils > Migration: SceneMigration', () => {
    test('Utils > Migration: Empty Test', async () => { });

    switch (eTYPE) {
        case eTestType.eNone:
            break;

        case eTestType.eProductionMigration:
            executeProductionMigration();
            break;
    }
});

function executeProductionMigration(): void {
    let user: DBAPI.User | null = null;
    for (const scenePackage of SceneMigrationPackages) {
        test('Utils > Migration: SceneMigration', async () => {
            jest.setTimeout(14400000);

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
