import * as DBAPI from '../../db';
import * as H from '../../utils/helpers';
import * as LOG from '../../utils/logger';
import { SceneMigration, SceneMigrationResults } from '../../utils/migration/SceneMigration';
import { SceneMigrationPackages } from '../../utils/migration/MigrationData';
import * as UTIL from '../../tests/db/api';

import { Request, Response } from 'express';
import * as NS from 'node-schedule';

export async function migrate(request: Request, response: Response): Promise<void> {
    try {
        const migrator: Migrator = new Migrator(request, response);
        if (!await migrator.parseArguments())
            return;

        const soon: Date = new Date(new Date().getTime() + 1000); // start 1 second from now
        NS.scheduleJob(soon, () => Migrator.launcher(migrator));
        response.send('Migration Scheduled');
    } catch (error) {
        LOG.error('migrate', LOG.LS.eMIG, error);
    }
}

class Migrator {
    results: string = '';
    success: boolean = true;

    private request: Request;
    private response: Response;
    private sceneIDSet: Set<string> | undefined | null = undefined; // undefined means do not migrate; null means migrate all; non-null means migrate only matches
    private modelIDSet: Set<string> | undefined | null = undefined; // undefined means do not migrate; null means migrate all; non-null means migrate only matches
    private migrationUserEmail: string = 'tysonj@si.edu';

    constructor(request: Request, response: Response) {
        this.request = request;
        this.response = response;
    }

    static async launcher(migrator: Migrator): Promise<boolean> {
        if (!await migrator.parseArguments())
            return false;
        return await migrator.migrate();
    }

    /** Returns false if arguments are invalid */
    async parseArguments(): Promise<boolean> {
        // All entry points below perform migration for objects not yet migrated
        // /migrate                     Performs full migration
        // /migrate/scenes              Performs full scene migration
        // /migrate/models              Performs full model migration
        // /migrate/scene/ID            Performs scene migration for scene with EdanUUID of ID (comma-separated list)
        // /migrate/model/ID            Performs model migration for model with Unique ID of ID (comma-separated list)

        const requestPath: string = this.request.path;
        let handled: boolean = true;
        switch (requestPath) {
            case '/migrate':        this.sceneIDSet = null; this.modelIDSet = null; break;
            case '/migrate/scenes': this.sceneIDSet = null; break;
            case '/migrate/models': this.modelIDSet = null; break;
            default:                handled = false; break;
        }
        if (handled)
            return true;

        let flavor: string | null = null;
        let idList: string | null = null;
        const regexIDMatcher: RegExp = new RegExp('/migrate/(scene|model)/(.*)', 'i');
        const downloadMatch: RegExpMatchArray | null = requestPath.match(regexIDMatcher);
        if (downloadMatch && downloadMatch.length === 3) {
            flavor = downloadMatch[1];
            idList = downloadMatch[2];
        }

        if ((flavor !== 'scene' && flavor !== 'model') || idList === null)
            return this.sendError(404, `/migrate called with invalid url ${requestPath}`);

        let idSet: Set<string> | undefined = undefined;
        switch (flavor) {
            case 'scene': idSet = this.sceneIDSet = new Set<string>(); break;
            case 'model': idSet = this.modelIDSet = new Set<string>(); break;
        }

        if (idSet) {
            for (const id of idList.split(','))
                idSet.add(id);
        }
        // LOG.info(`SceneMigration handling ${idList} with idSet ${H.Helpers.JSONStringify(idSet)})`, LOG.LS.eMIG);
        return true;
    }

    async migrate(): Promise<boolean> {
        const user: DBAPI.User = await this.fetchMigrationUser();

        this.results += 'Migration Started<br/>\n';
        if (this.sceneIDSet !== undefined) {
            this.results += 'Migrating Scenes<br/>\n';
            for (const scenePackage of SceneMigrationPackages) {
                if (this.sceneIDSet && !this.sceneIDSet.has(scenePackage.EdanUUID))
                    continue;
                const scenes: DBAPI.Scene[] | null = await DBAPI.Scene.fetchByUUID(scenePackage.EdanUUID);
                if (scenes && scenes.length > 0) {
                    this.recordMigrationResult(true, `SceneMigration (${scenePackage.EdanUUID}) skipped: already migrated`);
                    continue;
                }

                this.recordMigrationResult(true, `SceneMigration (${scenePackage.EdanUUID}) Starting`);
                const SM: SceneMigration = new SceneMigration();
                const SMR: SceneMigrationResults = await SM.migrateScene(user.idUser, scenePackage, true);
                if (!SMR.success)
                    this.recordMigrationResult(false, `SceneMigration (${scenePackage.EdanUUID}) failed for ${H.Helpers.JSONStringify(scenePackage)}: ${SMR.error}`);
                else
                    this.recordMigrationResult(true, `SceneMigration (${scenePackage.EdanUUID}) succeeded: ${H.Helpers.JSONStringify(SMR)}`);
            }
        }

        if (this.modelIDSet !== undefined)
            this.results += 'Migrating Models Not Yet Implemented<br/>\n';

        return true;
    }

    private async fetchMigrationUser(): Promise<DBAPI.User> {
        const users: DBAPI.User[] | null = await DBAPI.User.fetchByEmail(this.migrationUserEmail);
        return (users && users.length > 0)
            ? users[0]
            : await UTIL.createUserTest({ Name: 'Migration User', EmailAddress: this.migrationUserEmail, SecurityID: 'Migration User', Active: true, DateActivated: UTIL.nowCleansed(), DateDisabled: null, WorkflowNotificationTime: UTIL.nowCleansed(), EmailSettings: 0, idUser: 0 });
    }

    private recordMigrationResult(success: boolean, message: string): void {
        if (success)
            LOG.info(message, LOG.LS.eMIG);
        else {
            this.success = false;
            LOG.error(message, LOG.LS.eMIG);
        }

        this.results += `${message}<br/>\n`;
    }

    private sendError(statusCode: number, message: string): boolean {
        LOG.error(`/migrate error ${message}`, LOG.LS.eMIG);
        this.success = false;
        this.results += `Migration Failed: ${message}`;
        this.response.status(statusCode);
        this.response.send(message ?? '');
        return false;
    }
}
