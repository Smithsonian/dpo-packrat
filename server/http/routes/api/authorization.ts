/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import { ASL, LocalStore } from '../../../utils/localStore';
import { isAuthenticated } from '../../auth';
import { refreshUserSessions } from '../../../auth';
import { Authorization } from '../../../auth/Authorization';
import { Request, Response } from 'express';
import { Config } from '../../../config';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { eAuditType } from '../../../db/api/ObjectType';

const SRC = 'HTTP.Route.Authorization';

async function auditAuthChange(
    idAdminUser: number | null,
    type: eAuditType.eAuthGranted | eAuditType.eAuthRevoked,
    data: Record<string, unknown>
): Promise<void> {
    try {
        const audit = new DBAPI.Audit({
            idAudit: 0,
            idUser: idAdminUser,
            AuditDate: new Date(),
            AuditType: type,
            DBObjectType: null,
            idDBObject: null,
            idSystemObject: null,
            Data: JSON.stringify(data),
        });
        await audit.create();
    } catch (_error) { /* best-effort */ }
}

type AuthResponse = {
    success: boolean;
    message?: string;
    data?: any;
};

const generateResponse = (success: boolean, message?: string, data?: any): AuthResponse => {
    return { success, message, data };
};

const isAdminAuthorized = async (req: Request): Promise<H.IOResults> => {
    if (!isAuthenticated(req)) {
        RK.logError(RK.LogSection.eHTTP, 'auth check failed', 'not authenticated', {}, SRC);
        return { success: false, error: 'not authenticated' };
    }

    const LS: LocalStore | undefined = ASL.getStore();
    if (!LS || !LS.idUser) {
        RK.logError(RK.LogSection.eHTTP, 'auth check failed', 'cannot get LocalStore or idUser', {}, SRC);
        return { success: false, error: `missing local store/user (${LS?.idUser})` };
    }

    if (!Config.auth.users.admin.includes(LS.idUser)) {
        RK.logError(RK.LogSection.eHTTP, 'auth check failed', 'user is not an admin', {}, SRC);
        return { success: false, error: `user (${LS.idUser}) does not have admin permission` };
    }

    return { success: true };
};

//#region GET /api/auth/user/:idUser/units
export async function getUserUnits(req: Request, res: Response): Promise<void> {
    const authResult = await isAdminAuthorized(req);
    if (!authResult.success) {
        res.status(200).send(JSON.stringify(generateResponse(false, `getUserUnits: ${authResult.error}`)));
        return;
    }

    const idUser: number = parseInt(req.params.idUser);
    if (!idUser || isNaN(idUser)) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'getUserUnits: invalid idUser')));
        return;
    }

    const unitIds: number[] = await DBAPI.UserAuthorization.fetchUnitsForUser(idUser);

    // Fetch unit details for the returned IDs
    const units: { idUnit: number; Name: string; Abbreviation: string | null }[] = [];
    for (const idUnit of unitIds) {
        const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(idUnit);
        if (unit)
            units.push({ idUnit: unit.idUnit, Name: unit.Name, Abbreviation: unit.Abbreviation });
    }

    res.status(200).send(JSON.stringify(generateResponse(true, undefined, { idUser, units })));
}
//#endregion

//#region PUT /api/auth/user/:idUser/units
export async function setUserUnits(req: Request, res: Response): Promise<void> {
    const authResult = await isAdminAuthorized(req);
    if (!authResult.success) {
        res.status(200).send(JSON.stringify(generateResponse(false, `setUserUnits: ${authResult.error}`)));
        return;
    }

    const idUser: number = parseInt(req.params.idUser);
    if (!idUser || isNaN(idUser)) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'setUserUnits: invalid idUser')));
        return;
    }

    const { unitIds } = req.body;
    if (!Array.isArray(unitIds) || unitIds.length === 0) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'setUserUnits: unitIds must be a non-empty array')));
        return;
    }

    // Fetch current unit assignments for this user
    const currentUnitIds: number[] = await DBAPI.UserAuthorization.fetchUnitsForUser(idUser);

    const toAdd: number[] = unitIds.filter((id: number) => !currentUnitIds.includes(id));
    const toRemove: number[] = currentUnitIds.filter(id => !unitIds.includes(id));

    // Remove assignments no longer desired
    for (const idUnit of toRemove) {
        const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetchFromUnitID(idUnit);
        if (!SO) continue;
        const ua: DBAPI.UserAuthorization | null = await DBAPI.UserAuthorization.fetchByUserAndSystemObject(idUser, SO.idSystemObject);
        if (ua)
            await ua.delete();
    }

    // Add new assignments
    const LS: LocalStore | undefined = ASL.getStore();
    const idUserCreator: number | null = LS?.idUser ?? null;

    for (const idUnit of toAdd) {
        const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetchFromUnitID(idUnit);
        if (!SO) {
            RK.logError(RK.LogSection.eHTTP, 'setUserUnits', `no SystemObject for unit ${idUnit}`, {}, SRC);
            continue;
        }
        const ua: DBAPI.UserAuthorization = new DBAPI.UserAuthorization({
            idUserAuthorization: 0,
            idUser,
            idSystemObject: SO.idSystemObject,
            DateCreated: new Date(),
            idUserCreator,
        });
        await ua.create();
    }

    RK.logInfo(RK.LogSection.eHTTP, 'setUserUnits', `updated units for user ${idUser}: added ${toAdd.length}, removed ${toRemove.length}`, {}, SRC);

    // Audit permission changes
    for (const idUnit of toAdd)
        await auditAuthChange(idUserCreator, eAuditType.eAuthGranted, { surface: 'setUserUnits', idUser, idUnit, action: 'addUnitToUser' });
    for (const idUnit of toRemove)
        await auditAuthChange(idUserCreator, eAuditType.eAuthRevoked, { surface: 'setUserUnits', idUser, idUnit, action: 'removeUnitFromUser' });

    await refreshUserSessions([idUser]);

    res.status(200).send(JSON.stringify(generateResponse(true, 'Updated unit assignments', { unitIds })));
}
//#endregion

//#region GET /api/auth/unit/:idUnit
export async function getUnitAuth(req: Request, res: Response): Promise<void> {
    const authResult = await isAdminAuthorized(req);
    if (!authResult.success) {
        res.status(200).send(JSON.stringify(generateResponse(false, `getUnitAuth: ${authResult.error}`)));
        return;
    }

    const idUnit: number = parseInt(req.params.idUnit);
    if (!idUnit || isNaN(idUnit)) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'getUnitAuth: invalid idUnit')));
        return;
    }

    const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(idUnit);
    if (!unit) {
        res.status(200).send(JSON.stringify(generateResponse(false, `getUnitAuth: unit ${idUnit} not found`)));
        return;
    }

    const authorizedUsers = await DBAPI.UserAuthorization.fetchUsersForUnit(idUnit);

    res.status(200).send(JSON.stringify(generateResponse(true, undefined, {
        idUnit: unit.idUnit,
        Name: unit.Name,
        authorizedUsers,
    })));
}
//#endregion

//#region PUT /api/auth/unit/:idUnit
export async function setUnitAuth(req: Request, res: Response): Promise<void> {
    const authResult = await isAdminAuthorized(req);
    if (!authResult.success) {
        res.status(200).send(JSON.stringify(generateResponse(false, `setUnitAuth: ${authResult.error}`)));
        return;
    }

    const idUnit: number = parseInt(req.params.idUnit);
    if (!idUnit || isNaN(idUnit)) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'setUnitAuth: invalid idUnit')));
        return;
    }

    const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(idUnit);
    if (!unit) {
        res.status(200).send(JSON.stringify(generateResponse(false, `setUnitAuth: unit ${idUnit} not found`)));
        return;
    }

    const { authorizedUserIds } = req.body;

    if (!Array.isArray(authorizedUserIds)) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'setUnitAuth: authorizedUserIds must be an array')));
        return;
    }

    const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetchFromUnitID(idUnit);
    if (!SO) {
        res.status(200).send(JSON.stringify(generateResponse(false, `setUnitAuth: no SystemObject for unit ${idUnit}`)));
        return;
    }

    const currentRows: DBAPI.UserAuthorization[] | null = await DBAPI.UserAuthorization.fetchFromSystemObject(SO.idSystemObject);
    const currentUserIds: number[] = currentRows ? currentRows.map(r => r.idUser) : [];

    const toAdd: number[] = authorizedUserIds.filter((id: number) => !currentUserIds.includes(id));
    const toRemove: number[] = currentUserIds.filter(id => !authorizedUserIds.includes(id));

    for (const idUser of toRemove) {
        const ua: DBAPI.UserAuthorization | null = await DBAPI.UserAuthorization.fetchByUserAndSystemObject(idUser, SO.idSystemObject);
        if (ua)
            await ua.delete();
    }

    const LS: LocalStore | undefined = ASL.getStore();
    const idUserCreator: number | null = LS?.idUser ?? null;

    for (const idUser of toAdd) {
        const ua: DBAPI.UserAuthorization = new DBAPI.UserAuthorization({
            idUserAuthorization: 0,
            idUser,
            idSystemObject: SO.idSystemObject,
            DateCreated: new Date(),
            idUserCreator,
        });
        await ua.create();
    }

    RK.logInfo(RK.LogSection.eHTTP, 'setUnitAuth', `updated auth for unit ${idUnit}: added ${toAdd.length}, removed ${toRemove.length}`, {}, SRC);

    // Audit permission changes
    for (const idUser of toAdd)
        await auditAuthChange(idUserCreator, eAuditType.eAuthGranted, { surface: 'setUnitAuth', idUser, idUnit, action: 'addUserToUnit' });
    for (const idUser of toRemove)
        await auditAuthChange(idUserCreator, eAuditType.eAuthRevoked, { surface: 'setUnitAuth', idUser, idUnit, action: 'removeUserFromUnit' });

    const affectedUserIds = [...new Set([...toAdd, ...toRemove])];
    await refreshUserSessions(affectedUserIds);

    res.status(200).send(JSON.stringify(generateResponse(true, 'Updated unit authorization')));
}
//#endregion

//#region GET /api/auth/project/:idProject
export async function getProjectAuth(req: Request, res: Response): Promise<void> {
    const authResult = await isAdminAuthorized(req);
    if (!authResult.success) {
        res.status(200).send(JSON.stringify(generateResponse(false, `getProjectAuth: ${authResult.error}`)));
        return;
    }

    const idProject: number = parseInt(req.params.idProject);
    if (!idProject || isNaN(idProject)) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'getProjectAuth: invalid idProject')));
        return;
    }

    const project: DBAPI.Project | null = await DBAPI.Project.fetch(idProject);
    if (!project) {
        res.status(200).send(JSON.stringify(generateResponse(false, `getProjectAuth: project ${idProject} not found`)));
        return;
    }

    const authorizedUsers = await DBAPI.UserAuthorization.fetchUsersForProject(idProject);

    res.status(200).send(JSON.stringify(generateResponse(true, undefined, {
        idProject: project.idProject,
        Name: project.Name,
        isRestricted: project.isRestricted,
        authorizedUsers,
    })));
}
//#endregion

//#region PUT /api/auth/project/:idProject
export async function setProjectAuth(req: Request, res: Response): Promise<void> {
    const authResult = await isAdminAuthorized(req);
    if (!authResult.success) {
        res.status(200).send(JSON.stringify(generateResponse(false, `setProjectAuth: ${authResult.error}`)));
        return;
    }

    const idProject: number = parseInt(req.params.idProject);
    if (!idProject || isNaN(idProject)) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'setProjectAuth: invalid idProject')));
        return;
    }

    const project: DBAPI.Project | null = await DBAPI.Project.fetch(idProject);
    if (!project) {
        res.status(200).send(JSON.stringify(generateResponse(false, `setProjectAuth: project ${idProject} not found`)));
        return;
    }

    const { isRestricted, authorizedUserIds } = req.body;

    const isRestrictedBefore: boolean = project.isRestricted;

    // Update isRestricted if provided
    if (typeof isRestricted === 'boolean') {
        project.isRestricted = isRestricted;
        await project.update();
    }

    // Warn if restricted with no authorized users
    if (project.isRestricted && (!Array.isArray(authorizedUserIds) || authorizedUserIds.length === 0)) {
        RK.logWarning(RK.LogSection.eHTTP, 'setProjectAuth', `project ${idProject} set to restricted with no authorized users`, {}, SRC);
    }

    // Track affected users for session refresh
    const affectedUserIds = new Set<number>();

    // Diff user authorizations if provided
    if (Array.isArray(authorizedUserIds)) {
        const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetchFromProjectID(idProject);
        if (!SO) {
            res.status(200).send(JSON.stringify(generateResponse(false, `setProjectAuth: no SystemObject for project ${idProject}`)));
            return;
        }

        const currentRows: DBAPI.UserAuthorization[] | null = await DBAPI.UserAuthorization.fetchFromSystemObject(SO.idSystemObject);
        const currentUserIds: number[] = currentRows ? currentRows.map(r => r.idUser) : [];

        const toAdd: number[] = authorizedUserIds.filter((id: number) => !currentUserIds.includes(id));
        const toRemove: number[] = currentUserIds.filter(id => !authorizedUserIds.includes(id));

        for (const idUser of toRemove) {
            const ua: DBAPI.UserAuthorization | null = await DBAPI.UserAuthorization.fetchByUserAndSystemObject(idUser, SO.idSystemObject);
            if (ua)
                await ua.delete();
        }

        const LSProj: LocalStore | undefined = ASL.getStore();
        const idUserCreatorProj: number | null = LSProj?.idUser ?? null;

        for (const idUser of toAdd) {
            const ua: DBAPI.UserAuthorization = new DBAPI.UserAuthorization({
                idUserAuthorization: 0,
                idUser,
                idSystemObject: SO.idSystemObject,
                DateCreated: new Date(),
                idUserCreator: idUserCreatorProj,
            });
            await ua.create();
        }

        toAdd.forEach(id => affectedUserIds.add(id));
        toRemove.forEach(id => affectedUserIds.add(id));

        // Audit permission changes
        const LSAudit: LocalStore | undefined = ASL.getStore();
        const idAuditAdmin: number | null = LSAudit?.idUser ?? null;
        for (const idUser of toAdd)
            await auditAuthChange(idAuditAdmin, eAuditType.eAuthGranted, { surface: 'setProjectAuth', idUser, idProject, action: 'addUserToProject' });
        for (const idUser of toRemove)
            await auditAuthChange(idAuditAdmin, eAuditType.eAuthRevoked, { surface: 'setProjectAuth', idUser, idProject, action: 'removeUserFromProject' });

        RK.logInfo(RK.LogSection.eHTTP, 'setProjectAuth', `updated auth for project ${idProject}: added ${toAdd.length}, removed ${toRemove.length}`, {}, SRC);

        // Notify users added to a restricted project via email
        if (project.isRestricted && toAdd.length > 0) {
            for (const idUser of toAdd) {
                const addedUser: DBAPI.User | null = await DBAPI.User.fetch(idUser);
                if (addedUser?.EmailAddress) {
                    RK.sendEmailRaw(
                        RK.NotifyType.SECURITY_NOTICE,
                        [addedUser.EmailAddress],
                        `Packrat: Access Granted to Restricted Project "${project.Name}"`,
                        `You have been granted access to the restricted project "${project.Name}" in Packrat.\n\nThis means you can now view and work with data in this project. If you believe this was done in error, please contact your administrator.`
                    );
                }
            }
        }
    }

    // If isRestricted changed, all users assigned to the parent unit are affected
    if (typeof isRestricted === 'boolean' && project.isRestricted !== isRestrictedBefore) {
        const parentUnitId = await Authorization.getProjectParentUnitId(idProject);
        if (parentUnitId !== null) {
            const unitUsers = await DBAPI.UserAuthorization.fetchUsersForUnit(parentUnitId);
            unitUsers.forEach(u => affectedUserIds.add(u.idUser));
        }
    }

    await refreshUserSessions([...affectedUserIds]);

    res.status(200).send(JSON.stringify(generateResponse(true, 'Updated project authorization')));
}
//#endregion

//#region GET /api/auth/users
export async function getAuthUsers(_req: Request, res: Response): Promise<void> {
    const authResult = await isAdminAuthorized(_req);
    if (!authResult.success) {
        res.status(200).send(JSON.stringify(generateResponse(false, `getAuthUsers: ${authResult.error}`)));
        return;
    }

    const users: DBAPI.User[] | null = await DBAPI.User.fetchUserList('', DBAPI.eUserStatus.eAll);
    if (!users) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'getAuthUsers: failed to fetch users')));
        return;
    }

    const data = users.map(u => ({
        idUser: u.idUser,
        Name: u.Name,
        EmailAddress: u.EmailAddress,
        Active: u.Active,
    }));

    res.status(200).send(JSON.stringify(generateResponse(true, undefined, data)));
}
//#endregion

//#region GET /api/auth/units
export async function getAuthUnits(_req: Request, res: Response): Promise<void> {
    const authResult = await isAdminAuthorized(_req);
    if (!authResult.success) {
        res.status(200).send(JSON.stringify(generateResponse(false, `getAuthUnits: ${authResult.error}`)));
        return;
    }

    const units: DBAPI.Unit[] | null = await DBAPI.Unit.fetchAll();
    if (!units) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'getAuthUnits: failed to fetch units')));
        return;
    }

    const data = units.map(u => ({
        idUnit: u.idUnit,
        Name: u.Name,
        Abbreviation: u.Abbreviation,
    }));

    res.status(200).send(JSON.stringify(generateResponse(true, undefined, data)));
}
//#endregion

//#region GET /api/auth/projects
export async function getAuthProjects(_req: Request, res: Response): Promise<void> {
    const authResult = await isAdminAuthorized(_req);
    if (!authResult.success) {
        res.status(200).send(JSON.stringify(generateResponse(false, `getAuthProjects: ${authResult.error}`)));
        return;
    }

    const projects: DBAPI.Project[] | null = await DBAPI.Project.fetchAll();
    if (!projects) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'getAuthProjects: failed to fetch projects')));
        return;
    }

    const data = projects.map(p => ({
        idProject: p.idProject,
        Name: p.Name,
        isRestricted: p.isRestricted,
    }));

    res.status(200).send(JSON.stringify(generateResponse(true, undefined, data)));
}
//#endregion

//#region GET /api/auth/summary
export async function getAuthSummary(_req: Request, res: Response): Promise<void> {
    const authResult = await isAdminAuthorized(_req);
    if (!authResult.success) {
        res.status(200).send(JSON.stringify(generateResponse(false, `getAuthSummary: ${authResult.error}`)));
        return;
    }

    const rows: DBAPI.AuthSummaryRow[] = await DBAPI.UserAuthorization.fetchAuthSummary();
    const data = rows.map(r => ({ ...r, isRestricted: Boolean(r.isRestricted) }));

    res.status(200).send(JSON.stringify(generateResponse(true, undefined, data)));
}
//#endregion

//#region GET /api/auth/denials
export async function getAuthDenials(req: Request, res: Response): Promise<void> {
    const authResult = await isAdminAuthorized(req);
    if (!authResult.success) {
        res.status(200).send(JSON.stringify(generateResponse(false, `getAuthDenials: ${authResult.error}`)));
        return;
    }

    const startParam = req.query.startDate as string | undefined;
    const endParam = req.query.endDate as string | undefined;

    if (!startParam || !endParam) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'getAuthDenials: startDate and endDate query params required')));
        return;
    }

    const startDate = new Date(startParam);
    const endDate = new Date(endParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'getAuthDenials: invalid date format')));
        return;
    }

    // Set end date to end of day (23:59:59.999)
    endDate.setHours(23, 59, 59, 999);

    const rows: DBAPI.AuditDenialRow[] = await DBAPI.Audit.fetchAuthDenialsByDateRange(startDate, endDate);

    res.status(200).send(JSON.stringify(generateResponse(true, undefined, rows)));
}
//#endregion
