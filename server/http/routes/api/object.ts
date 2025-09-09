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
export async function getObjectStatus(req: Request, res: Response): Promise<void> {

    // make sure we're authorized to run this routine
    const authResult = await isAuthorized(req);
    if(authResult.success===false) {
        res.status(200).send(JSON.stringify(generateResponse(false,`getObjectStatus: ${authResult.error}`)));
        return;
    }

    // get our object and system object
    const { id } = req.params;
    const idSystemObject: number = parseInt(id);
    const systemObject: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
    if(!systemObject) {
        res.status(200).send(JSON.stringify(generateResponse(false,`getObjectStatus failed. no system object for: ${idSystemObject}`)));
        return;
    }

    // currently we only support Scene objects
    if(!systemObject.idScene) {
        res.status(200).send(JSON.stringify(generateResponse(false,`getObjectStatus failed. only Scene objects supported: ${idSystemObject}`)));
        return;
    }

    // get our scene
    const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(systemObject.idScene);
    if(!scene) {
        res.status(200).send(JSON.stringify(generateResponse(false,`getObjectStatus failed. no scene for: ${systemObject.idScene}`)));
        return;
    }

    // get our status for the scene
    const profileKey: string = 'calc_status_'+H.Helpers.randomSlug();
    RK.profile(profileKey,RK.LogSection.eHTTP,'calculating scene status',{ name: scene.Name, idScene: scene.idScene, idSystemObject });
    const sceneSummary: SceneSummary | null = await buildProjectSceneDef(scene,null);
    if(!sceneSummary) {
        res.status(200).send(JSON.stringify(generateResponse(false,`getObjectStatus failed. cannot build scene summary: ${systemObject.idScene}`)));
        return;
    }
    RK.profileEnd(profileKey);

    // helpers for determining state
    const formatResultField = (status: string, level: 'pass' | 'fail' | 'warn' | 'critical', notes: string): any => {
        return { status, level, notes };
    };
    const getCaptureDataStatus = (count: number, expected: number): { status: string, level: string, notes: string } => {

        if (count === 0 && expected <= 0)
            return { status: 'Missing', level: 'warn', notes: 'no datasets found linked to the MediaGroup or source model' };
        else if(expected > 0 && count < expected)
            return { status: 'Error', level: 'fail', notes: `${count}/${expected} datasets found. more linked to MediaGroup than source model` };
        else if(count === expected)
            return { status: 'Found', level: 'pass', notes: `${count}/${expected} datasets found` };
        else if(count > expected)
            return { status: 'Warning', level: 'warn', notes: `${count}/${expected} datasets found. source model has unexpected dataset. (CAD?)` };
        else
            return { status: 'Error', level: 'fail', notes: `${count}/${expected} datasets found. unexpected relationships` };
    };
    const getARStatus = (status: string): { status: string, level: string, notes: string } => {
        // TODO: check if downloads supported by license to determin severity
        switch(status) {
            case 'Good':
                return { status: 'Found', level: 'pass', notes: 'all AR models found' };
            case 'Missing: WebAR':
                return { status, level: 'fail', notes: 'WebXR models are generated with the scene. Try regenerating it from the source model page' };
            case 'Missing: NativeAR':
                return { status, level: 'warn', notes: 'Native AR models are generated with downloads' };
            default:
                return { status: 'Error', level: 'critical', notes: 'unexpected AR model status' };
        }
    };

    // figure out QC status
    const thumbnails = formatResultField('Found','pass','all thumbnails found');
    const reviewed = sceneSummary.isReviewed ?
        formatResultField('Reviewed','pass','Marked as reviewed') :
        formatResultField('Not Reviewed','fail','Valid but not reviewed');

    // our core/base models for Voyager
    const baseModels = sceneSummary.derivatives.models.status === 'Good' ?
        formatResultField('Found','pass','all base models found') :
        formatResultField('Missing','fail',`${sceneSummary.derivatives.models.items.length}/${sceneSummary.derivatives.models.expected} base models found`);

    // figure out AR models
    const arModels = getARStatus(sceneSummary.derivatives.ar.status);

    // capture data status
    const captureData = getCaptureDataStatus(sceneSummary.sources.captureData.items.length,sceneSummary.sources.captureData.expected ?? -1);

    // return object structure
    const result = {
        idSystemObject: systemObject.idSystemObject,
        idScene: systemObject.idScene,
        isLive: true,
        liveUrl: 'https://3d.si.edu/object/3d/0f03aac5-f1d3-41be-b19d-caa2ecc2f908',
        published: { status: 'Public', level: 'pass', notes: 'Latest version published' },
        license: { status: 'CC0', level: 'pass', notes: 'License assigned correctly' },
        reviewed,
        scale: { status: 'Good', level: 'pass', notes: 'Scene scale aligns with units chosen' },
        thumbnails,
        baseModels,
        downloads: { status: 'Missing', level: 'fail', notes: 'downloads not found. license expects them. generate downloads above' },
        arModels,
        captureData,
        network: { status: 'Good', level: 'pass', notes: 'all object relationships are valid' }
    };

    // return success
    res.status(200).send(JSON.stringify(generateResponse(true,'Returned scene summary',result)));
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

    try {
        // get our body
        const body = req.body;
        if(!body)
            throw new Error('invalid body');

        const contactArgs = {
            idContact: 0,
            Name: body.Name ?? 'NA',
            EmailAddress: body.EmailAddress ?? 'NA',
            Title: body.Title ?? null,           // null if optional
            idUnit: body.idUnit ?? null,         // null, not -1
            Department: body.Department ?? null, // null if optional
        };
        const Contact = new DBAPI.Contact(contactArgs);
        const result: boolean = await Contact.create();
        if(!result)
            throw new Error('failed to create DB row');

        RK.logInfo(RK.LogSection.eHTTP,'create contact',`success: ${body.Name} (${body.idContact})`,Contact,'HTTP.Object.CreateContact' ,true);
        res.status(200).send(JSON.stringify(generateResponse(true,`create contact success for: ${Contact.idContact}`,Contact)));
    } catch(err) {
        const error = H.Helpers.getErrorString(err);
        RK.logError(RK.LogSection.eHTTP,'update contact',`failed: ${error}`,H.Helpers.cleanExpressRequest(req,false,true,true));
        res.status(200).send(JSON.stringify(generateResponse(false,`cannot create/update contact: ${error}`)));
        return;
    }
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

        // success
        RK.logInfo(RK.LogSection.eHTTP,'get units',`success: ${contacts.length}`,null,'HTTP.Object.GetUnit',false);
        res.status(200).send(JSON.stringify(generateResponse(true,`returned ${contacts.length} contacts`,contacts)));
    } catch (err) {
        const error = H.Helpers.getErrorString(err);
        RK.logError(RK.LogSection.eHTTP,'get contact',`failed: ${error}`,H.Helpers.cleanExpressRequest(req,false,true,true));
        res.status(200).send(JSON.stringify(generateResponse(false,`no contacts: ${error}`)));
        return;
    }
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
        if(!id || isNaN(idContact) || idContact <= 0)
            throw new Error(`invalid id for update: ${id}`);

        // get our body
        const body = req.body;
        if(!body)
            throw new Error('invalid body');

        // grab our DB object
        const contact: DBAPI.Contact | null = await DBAPI.Contact.fetch(body.idContact);
        if(!contact)
            throw new Error(`no Contact found for id: ${body.idContact}`);

        // fill it with changes
        contact.Name = body.Name;
        contact.EmailAddress = body.EmailAddress;
        contact.Title = body.Title;
        contact.Department = body.Department;
        contact.idUnit = body.idUnit;

        // TODO: validate new values
        // ...

        // update DB item
        const result: boolean = await contact.update();
        if(result===false)
            throw new Error('failed to update Contact');

        RK.logInfo(RK.LogSection.eHTTP,'update contact',`success: ${body.Name} (${body.idContact})`,body,'HTTP.Object.UpdateContact' ,true);
        res.status(200).send(JSON.stringify(generateResponse(true,`updated contact: ${body.Name} (${body.idContact})`)));
    } catch(err) {
        const error = H.Helpers.getErrorString(err);
        RK.logError(RK.LogSection.eHTTP,'update contact',`failed: ${error}`,H.Helpers.cleanExpressRequest(req,false,true,true));
        res.status(200).send(JSON.stringify(generateResponse(false,`cannot create/update contact: ${error}`)));
        return;
    }
}
//#endregion

//#region UNIT
export async function getUnit(req: Request, res: Response): Promise<void> {
    // make sure we're authorized to run this routine
    const authResult = await isAuthorized(req);
    if(authResult.success===false) {
        res.status(200).send(JSON.stringify(generateResponse(false,`getUnit failed: ${authResult.error}`)));
        return;
    }

    let units: DBAPI.Unit[] | null = [];
    try {
        const { id } = req.params;
        const idUnit = id ? parseInt(id, 10) : NaN;

        if (!id || isNaN(idUnit) || idUnit <= 0) {
            // fetch all
            units = await DBAPI.Unit.fetchAll();
            if(!units)
                throw new Error('cannot fetch from DB');
        } else {
            // fetch one
            const unit = await DBAPI.Unit.fetch(idUnit);
            if(!unit)
                throw new Error('invalid id');
            units = [unit];
        }

        // sort our list by id
        const sorted = [...units]; //[...units].sort((a, b) => a.idUnit - b.idUnit);

        RK.logInfo(RK.LogSection.eHTTP,'get units',`success: ${units.length}`,null,'HTTP.Object.GetUnit',false);
        res.status(200).send(JSON.stringify(generateResponse(true,`returned ${units.length} units`,sorted)));
    } catch (err) {
        const error = H.Helpers.getErrorString(err);
        RK.logError(RK.LogSection.eHTTP,'get unit',`failed: ${error}`,H.Helpers.cleanExpressRequest(req,false,true,true));
        res.status(200).send(JSON.stringify(generateResponse(false,`no units: ${error}`)));
        return;
    }
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