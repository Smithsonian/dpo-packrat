/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import { ASL, LocalStore } from '../../../utils/localStore';
import { isAuthenticated } from '../../auth';
import { Request, Response } from 'express';
import { Config } from '../../../config';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { buildProjectSceneDef, SceneSummary } from './project';

//#region Types and Definitions

// NOTE: 'Summary' types/objects are intended for return via the API and for external use
//       so non-standard types (e.g. enums) are converted to strings for clarity/accessibility.
type ProjectResponse = {
    success: boolean,           // was the request successful
    message?: string,           // errors from the request|workflow to put in console or display to user
    data?
};

//#region SCENE
export async function getSceneState(req: Request, res: Response): Promise<void> {

    // make sure we're authorized to run this routine
    const authResult = await isAuthorized(req);
    if(authResult.success===false) {
        res.status(200).send(JSON.stringify(generateResponse(false,`getSceneState: ${authResult.error}`)));
        return;
    }

    // get our scene object and system object
    const { id } = req.params;
    const idSystemObject: number = parseInt(id);
    const systemObject: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
    if(!systemObject || !systemObject.idScene) {
        res.status(200).send(JSON.stringify(generateResponse(false,`getSceneState failed. no system object for: ${idSystemObject}`)));
        return;
    }
    const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(systemObject.idScene);
    if(!scene) {
        res.status(200).send(JSON.stringify(generateResponse(false,`getSceneState failed. no scene for: ${systemObject.idScene}`)));
        return;
    }

    // get our status for the scene
    const profileKey: string = 'calc_status_'+H.Helpers.randomSlug();
    RK.profile(profileKey,RK.LogSection.eHTTP,'calculating scene status',{ name: scene.Name, idScene: scene.idScene, idSystemObject });
    const sceneSummary: SceneSummary | null = await buildProjectSceneDef(scene,null);
    if(!sceneSummary) {
        res.status(200).send(JSON.stringify(generateResponse(false,`getSceneState failed. cannot build scene summary: ${systemObject.idScene}`)));
        return;
    }
    RK.profileEnd(profileKey);

    // return success
    res.status(200).send(JSON.stringify(generateResponse(true,'Returned scene summary',sceneSummary)));
}
//#endregion

//#region CONTACT
export async function createContact(req: Request, res: Response): Promise<void> {
    // make sure we're authorized to run this routine
    const authResult = await isAuthorized(req);
    if(authResult.success===false) {
        res.status(200).send(JSON.stringify(generateResponse(false,`createContact failed: ${authResult.error}`)));
        return;
    }

    res.status(200).send(JSON.stringify(generateResponse(true,'[MOCK] created contact')));
}
export async function getContact(req: Request, res: Response): Promise<void> {
    // make sure we're authorized to run this routine
    const authResult = await isAuthorized(req);
    if(authResult.success===false) {
        res.status(200).send(JSON.stringify(generateResponse(false,`getContact failed: ${authResult.error}`)));
        return;
    }

    let contacts: DBAPI.Contact[] | null = [];
    try {
        const { id } = req.params;
        const idContact = id ? parseInt(id, 10) : NaN;

        if (!id || isNaN(idContact) || idContact <= 0) {
            // fetch all
            contacts = await DBAPI.Contact.fetchAll();
            if(!contacts)
                throw new Error('cannot fetch from DB');
        } else {
            // fetch one
            const contact = await DBAPI.Contact.fetch(idContact);
            if(!contact)
                throw new Error('invalid id');
            contacts = [contact];
        }
    } catch (err) {
        const error = H.Helpers.getErrorString(err);
        RK.logError(RK.LogSection.eHTTP,'get contact failed',error,H.Helpers.cleanExpressRequest(req,false,true,true));
        res.status(200).send(JSON.stringify(generateResponse(false,`no contacts: ${error}`)));
        return;
    }

    // return success
    res.status(200).send(JSON.stringify(generateResponse(true,'returned contacts',contacts)));
}
export async function updateContact(req: Request, res: Response): Promise<void> {

    // make sure we're authorized to run this routine
    const authResult = await isAuthorized(req);
    if(authResult.success===false) {
        res.status(200).send(JSON.stringify(generateResponse(false,`updateContact failed: ${authResult.error}`)));
        return;
    }

    try {
        const { id } = req.params;
        const idContact = id ? parseInt(id, 10) : NaN;
        const doCreate: boolean = (!id || isNaN(idContact) || idContact <= 0) ? false : true;

        if(doCreate) {
            console.log('create');
        } else {
            console.log('update');
        }
    } catch(err) {
        const error = H.Helpers.getErrorString(err);
        RK.logError(RK.LogSection.eHTTP,'update contact failed',error,H.Helpers.cleanExpressRequest(req,false,true,true));
        res.status(200).send(JSON.stringify(generateResponse(false,`cannot create/update contact: ${error}`)));
        return;
    }

    // check validity of body/params

    // see if it already exists and update if needed

    // else, create a new one in the database

    // return success
}
//#endregion

//#region Utility
const generateResponse = (success: boolean, message?: string | undefined, data?): ProjectResponse => {
    return {
        success,
        message,
        data
    };
};
const isAuthorized = async (req: Request): Promise<H.IOResults> => {

    // make sure we're authenticated (i.e. see if request has a 'user' object)
    if (!isAuthenticated(req)) {
        RK.logError(RK.LogSection.eHTTP,'is authorized failed','not authenticated',{},'HTTP.Route.Project');
        return { success: false, error: 'not authenticated' };
    }

    // get our LocalStore. If we don't have one then bail. it is needed for the user id, auditing, and workflows
    const LS: LocalStore | undefined = ASL.getStore();
    if(!LS || !LS.idUser){
        RK.logError(RK.LogSection.eHTTP,'is authorized failed','cannot get LocalStore or idUser',{},'HTTP.Route.Project');
        return { success: false, error: `missing local store/user (${LS?.idUser})` };
    }

    // make sure we're of specific class of user (e.g. tools)
    const authorizedUsers: number[] = [...new Set([...Config.auth.users.admin, ...Config.auth.users.tools])];
    if(!authorizedUsers.includes(LS.idUser)) {
        RK.logError(RK.LogSection.eHTTP,'is authorized failed','user is not authorized for this request',{},'HTTP.Route.Project');
        return { success: false, error: `user (${LS.idUser}) does not have permission.` };
    }

    return { success: true };
};
//#endregion