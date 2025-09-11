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

//#region OBJECT STATUS
type FieldStatus = {
    name: string,
    status: string,
    level: 'pass' | 'fail' | 'warn' | 'critical',
    notes: string
};
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
    const formatResultField = (name: string, status: string, level: 'pass' | 'fail' | 'warn' | 'critical', notes: string): FieldStatus => {
        return { name, status, level, notes };
    };
    const getCaptureDataStatus = (count: number, expected: number): FieldStatus => {
        const name = 'Capture Data';

        if (count === 0 && expected <= 0)
            return { name, status: 'Missing', level: 'warn', notes: 'no datasets found linked to the MediaGroup or source model' };
        else if(expected > 0 && count < expected)
            return { name, status: 'Error', level: 'fail', notes: `${count}/${expected} datasets found. more linked to MediaGroup than source model` };
        else if(count === expected)
            return { name, status: 'Found', level: 'pass', notes: `${count}/${expected} datasets found` };
        else if(count > expected)
            return { name, status: 'Warning', level: 'warn', notes: `${count}/${expected} datasets found. source model has unexpected dataset. (CAD?)` };
        else
            return { name, status: 'Error', level: 'fail', notes: `${count}/${expected} datasets found. unexpected relationships` };
    };
    const getModelARStatus = (status: string): FieldStatus => {
        // TODO: check if downloads supported by license to determin severity
        const name = 'Models: AR';

        switch(status) {
            case 'Good':
                return { name, status: 'Found', level: 'pass', notes: 'all AR models found' };
            case 'Missing: WebAR':
                return { name, status, level: 'fail', notes: 'WebXR models are generated with the scene. Try regenerating it from the source model page' };
            case 'Missing: NativeAR':
                return { name, status, level: 'warn', notes: 'Native AR models are generated with downloads' };
            default:
                return { name, status: 'Error', level: 'critical', notes: 'unexpected AR model status' };
        }
    };
    const getModelBaseStatus = (status: string, count: number, expected: number): FieldStatus => {
        const name = 'Models: Base';

        if(status === 'Good')
            return formatResultField(name,'Found','pass','all base models found');
        else
            return formatResultField(name,'Missing','fail',`${count}/${expected} base models found`);
    };
    const getReviewedStatus = (isReviewed: boolean): FieldStatus => {
        const name = 'Is Reviewed';
        if(isReviewed)
            return formatResultField(name,'Reviewed','pass','Marked as reviewed');
        else
            return formatResultField(name,'Not Reviewed','fail','Valid but not reviewed');
    };
    const getThumbnailsStatus = (): FieldStatus => {
        const name = 'Thumbnails';
        return formatResultField(name,'Found','pass','all thumbnails found');
    };

    // return object structure
    const result = {
        idSystemObject: systemObject.idSystemObject,
        idScene: systemObject.idScene,

        publishedUrl:
            'https://3d.si.edu/object/3d/0f03aac5-f1d3-41be-b19d-caa2ecc2f908',
        published:
            formatResultField('Published','Public','pass','Latest version published'),
        license:
            formatResultField('License','CC0','pass','License assigned correctly'),
        reviewed:
            getReviewedStatus(sceneSummary.isReviewed),
        scale:
            formatResultField('Scene Scale','Good','pass','Scene scale aligns with units chosen'),
        thumbnails:
            getThumbnailsStatus(),
        baseModels:
            getModelBaseStatus(sceneSummary.derivatives.models.status,sceneSummary.derivatives.models.items.length,sceneSummary.derivatives.models.expected ?? -1),
        downloads:
            formatResultField('Download Models','Missing','fail','downloads not found. license expects them. generate downloads above'),
        arModels:
            getModelARStatus(sceneSummary.derivatives.ar.status),
        captureData:
            getCaptureDataStatus(sceneSummary.sources.captureData.items.length,sceneSummary.sources.captureData.expected ?? -1)
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