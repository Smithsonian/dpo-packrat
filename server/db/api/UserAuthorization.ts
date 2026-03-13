/* eslint-disable camelcase */
import { UserAuthorization as UserAuthorizationBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export type AuthSummaryRow = {
    idUnit: number | null;
    UnitName: string | null;
    UnitAbbreviation: string | null;
    idProject: number;
    ProjectName: string;
    isRestricted: number;
    idUser: number | null;
    UserName: string | null;
    EmailAddress: string | null;
};

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
     * Returns users authorized for a specific unit.
     * Joins UserAuthorization -> SystemObject (where SO.idUnit = idUnit) -> User.
     */
    static async fetchUsersForUnit(idUnit: number): Promise<{ idUser: number; Name: string; EmailAddress: string }[]> {
        if (!idUnit)
            return [];
        try {
            return await DBC.DBConnection.prisma.$queryRaw<{ idUser: number; Name: string; EmailAddress: string }[]>`
                SELECT U.idUser, U.Name, U.EmailAddress
                FROM UserAuthorization AS UA
                JOIN SystemObject AS SO ON (UA.idSystemObject = SO.idSystemObject)
                JOIN User AS U ON (UA.idUser = U.idUser)
                WHERE SO.idUnit = ${idUnit}
                ORDER BY U.Name ASC`;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetchUsersForUnit failed',H.Helpers.getErrorString(error),{ idUnit, ...this },'DB.UserAuthorization');
            return [];
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
     * Returns a flat summary of all Unit→Project→User authorization relationships.
     * For unrestricted projects: users authorized via unit membership.
     * For restricted projects: users explicitly authorized on the project.
     */
    static async fetchAuthSummary(): Promise<AuthSummaryRow[]> {
        try {
            return await DBC.DBConnection.prisma.$queryRaw<AuthSummaryRow[]>`
                SELECT
                    PU.idUnit,
                    PU.UnitName,
                    PU.UnitAbbreviation,
                    P.idProject,
                    P.Name             AS ProjectName,
                    P.isRestricted,
                    AuthUsers.idUser,
                    AuthUsers.UserName,
                    AuthUsers.EmailAddress
                FROM Project AS P
                LEFT JOIN (
                    SELECT SO_p.idProject, U.idUnit, U.Name AS UnitName, U.Abbreviation AS UnitAbbreviation
                    FROM SystemObject AS SO_p
                    JOIN SystemObjectXref AS SOX ON (SOX.idSystemObjectDerived = SO_p.idSystemObject)
                    JOIN SystemObject AS SO_u ON (SO_u.idSystemObject = SOX.idSystemObjectMaster AND SO_u.idUnit IS NOT NULL)
                    JOIN Unit AS U ON (U.idUnit = SO_u.idUnit)
                    WHERE SO_p.idProject IS NOT NULL
                ) AS PU ON (PU.idProject = P.idProject)
                LEFT JOIN (
                    SELECT UA.idUser, Usr.Name AS UserName, Usr.EmailAddress, SO_ua.idUnit AS authIdUnit, NULL AS authIdProject
                    FROM UserAuthorization AS UA
                    JOIN User AS Usr ON (Usr.idUser = UA.idUser)
                    JOIN SystemObject AS SO_ua ON (SO_ua.idSystemObject = UA.idSystemObject)
                    WHERE SO_ua.idUnit IS NOT NULL
                    UNION
                    SELECT UA2.idUser, Usr2.Name AS UserName, Usr2.EmailAddress, NULL AS authIdUnit, SO_ua2.idProject AS authIdProject
                    FROM UserAuthorization AS UA2
                    JOIN User AS Usr2 ON (Usr2.idUser = UA2.idUser)
                    JOIN SystemObject AS SO_ua2 ON (SO_ua2.idSystemObject = UA2.idSystemObject)
                    WHERE SO_ua2.idProject IS NOT NULL
                ) AS AuthUsers ON (
                    (P.isRestricted = 0 AND AuthUsers.authIdUnit = PU.idUnit)
                    OR (P.isRestricted = 1 AND AuthUsers.authIdProject = P.idProject)
                )
                ORDER BY PU.UnitName, P.Name, AuthUsers.UserName`;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetchAuthSummary failed',H.Helpers.getErrorString(error),{ ...this },'DB.UserAuthorization');
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
