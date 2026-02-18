/* eslint-disable camelcase */
import { UserAuthorization as UserAuthorizationBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class UserAuthorization extends DBC.DBObject<UserAuthorizationBase> implements UserAuthorizationBase {
    idUserAuthorization!: number;
    idUser!: number;
    idSystemObject!: number;

    constructor(input: UserAuthorizationBase) {
        super(input);
    }

    public fetchTableName(): string { return 'UserAuthorization'; }
    public fetchID(): number { return this.idUserAuthorization; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idUser, idSystemObject } = this;
            ({ idUserAuthorization: this.idUserAuthorization, idUser: this.idUser,
                idSystemObject: this.idSystemObject } =
                await DBC.DBConnection.prisma.userAuthorization.create({
                    data: {
                        User:         { connect: { idUser }, },
                        SystemObject: { connect: { idSystemObject }, },
                    }
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.UserAuthorization');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idUserAuthorization, idUser, idSystemObject } = this;
            return await DBC.DBConnection.prisma.userAuthorization.update({
                where: { idUserAuthorization, },
                data: {
                    User:         { connect: { idUser }, },
                    SystemObject: { connect: { idSystemObject }, },
                }
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.UserAuthorization');
            return false;
        }
    }

    static async fetch(idUserAuthorization: number): Promise<UserAuthorization | null> {
        if (!idUserAuthorization)
            return null;
        try {
            return DBC.CopyObject<UserAuthorizationBase, UserAuthorization>(
                await DBC.DBConnection.prisma.userAuthorization.findUnique({ where: { idUserAuthorization, }, }), UserAuthorization);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ idUserAuthorization, ...this },'DB.UserAuthorization');
            return null;
        }
    }

    static async fetchFromUser(idUser: number): Promise<UserAuthorization[] | null> {
        if (!idUser)
            return null;
        try {
            return DBC.CopyArray<UserAuthorizationBase, UserAuthorization>(
                await DBC.DBConnection.prisma.userAuthorization.findMany({ where: { idUser } }), UserAuthorization);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from User failed',H.Helpers.getErrorString(error),{ idUser, ...this },'DB.UserAuthorization');
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<UserAuthorization[] | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBC.CopyArray<UserAuthorizationBase, UserAuthorization>(
                await DBC.DBConnection.prisma.userAuthorization.findMany({ where: { idSystemObject } }), UserAuthorization);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from SystemObject failed',H.Helpers.getErrorString(error),{ idSystemObject, ...this },'DB.UserAuthorization');
            return null;
        }
    }

    /**
     * Returns the Unit IDs for Units the user is authorized to access.
     * Joins UserAuthorization -> SystemObject where SystemObject.idUnit IS NOT NULL.
     */
    static async fetchUnitsForUser(idUser: number): Promise<number[]> {
        if (!idUser)
            return [];
        try {
            const rows = await DBC.DBConnection.prisma.$queryRaw<{ idUnit: number }[]>`
                SELECT SO.idUnit
                FROM UserAuthorization AS UA
                JOIN SystemObject AS SO ON (UA.idSystemObject = SO.idSystemObject)
                WHERE UA.idUser = ${idUser} AND SO.idUnit IS NOT NULL`;
            return rows.map(r => r.idUnit);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetchUnitsForUser failed',H.Helpers.getErrorString(error),{ idUser, ...this },'DB.UserAuthorization');
            return [];
        }
    }

    /**
     * Returns the Project IDs for Projects the user is explicitly authorized to access.
     * Joins UserAuthorization -> SystemObject where SystemObject.idProject IS NOT NULL.
     * This returns Projects the user is listed on (relevant for restricted Projects).
     */
    static async fetchProjectsForUser(idUser: number): Promise<number[]> {
        if (!idUser)
            return [];
        try {
            const rows = await DBC.DBConnection.prisma.$queryRaw<{ idProject: number }[]>`
                SELECT SO.idProject
                FROM UserAuthorization AS UA
                JOIN SystemObject AS SO ON (UA.idSystemObject = SO.idSystemObject)
                WHERE UA.idUser = ${idUser} AND SO.idProject IS NOT NULL`;
            return rows.map(r => r.idProject);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetchProjectsForUser failed',H.Helpers.getErrorString(error),{ idUser, ...this },'DB.UserAuthorization');
            return [];
        }
    }
}
