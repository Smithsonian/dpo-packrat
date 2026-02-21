/* eslint-disable camelcase */
import { UserAuthorization as UserAuthorizationBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class UserAuthorization extends DBC.DBObject<UserAuthorizationBase> implements UserAuthorizationBase {
    idUserAuthorization!: number;
    idUser!: number;
    idSystemObject!: number;
    DateCreated!: Date;
    idUserCreator!: number | null;

    constructor(input: UserAuthorizationBase) {
        super(input);
    }

    public fetchTableName(): string { return 'UserAuthorization'; }
    public fetchID(): number { return this.idUserAuthorization; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idUser, idSystemObject, DateCreated, idUserCreator } = this;
            ({ idUserAuthorization: this.idUserAuthorization, idUser: this.idUser,
                idSystemObject: this.idSystemObject, DateCreated: this.DateCreated,
                idUserCreator: this.idUserCreator } =
                await DBC.DBConnection.prisma.userAuthorization.create({
                    data: {
                        idUser,
                        idSystemObject,
                        DateCreated:   DateCreated ?? new Date(),
                        idUserCreator: idUserCreator ?? null,
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

    protected async deleteWorker(): Promise<boolean> {
        try {
            const { idUserAuthorization } = this;
            await DBC.DBConnection.prisma.userAuthorization.delete({
                where: { idUserAuthorization },
            });
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'delete failed',H.Helpers.getErrorString(error),{ ...this },'DB.UserAuthorization');
            return false;
        }
    }

    /**
     * Returns users authorized for a specific project.
     * Joins UserAuthorization -> SystemObject (where SO.idProject = idProject) -> User.
     */
    static async fetchUsersForProject(idProject: number): Promise<{ idUser: number; Name: string; EmailAddress: string }[]> {
        if (!idProject)
            return [];
        try {
            return await DBC.DBConnection.prisma.$queryRaw<{ idUser: number; Name: string; EmailAddress: string }[]>`
                SELECT U.idUser, U.Name, U.EmailAddress
                FROM UserAuthorization AS UA
                JOIN SystemObject AS SO ON (UA.idSystemObject = SO.idSystemObject)
                JOIN User AS U ON (UA.idUser = U.idUser)
                WHERE SO.idProject = ${idProject}
                ORDER BY U.Name ASC`;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetchUsersForProject failed',H.Helpers.getErrorString(error),{ idProject, ...this },'DB.UserAuthorization');
            return [];
        }
    }

    /**
     * Fetches a specific UserAuthorization row by (idUser, idSystemObject).
     */
    static async fetchByUserAndSystemObject(idUser: number, idSystemObject: number): Promise<UserAuthorization | null> {
        if (!idUser || !idSystemObject)
            return null;
        try {
            return DBC.CopyObject<UserAuthorizationBase, UserAuthorization>(
                await DBC.DBConnection.prisma.userAuthorization.findFirst({
                    where: { idUser, idSystemObject }
                }), UserAuthorization);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetchByUserAndSystemObject failed',H.Helpers.getErrorString(error),{ idUser, idSystemObject, ...this },'DB.UserAuthorization');
            return null;
        }
    }
}
