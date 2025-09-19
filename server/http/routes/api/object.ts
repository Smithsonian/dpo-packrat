/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import * as COMMON from '@dpo-packrat/common';
import { ASL, LocalStore } from '../../../utils/localStore';
import { isAuthenticated } from '../../auth';
import { Request, Response } from 'express';
import { Config, ENVIRONMENT_TYPE } from '../../../config';
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
    console.log(sceneSummary);
    RK.profileEnd(profileKey);

    // helpers for determining state
    const formatResultField = (name: string, status: string, level: 'pass' | 'fail' | 'warn' | 'critical', notes: string): FieldStatus => {
        return { name, status, level, notes };
    };
    const getReviewedStatus = (isReviewed: boolean): FieldStatus => {
        const name = 'Is Reviewed';
        if(isReviewed)
            return formatResultField(name,'Reviewed','pass','Marked as reviewed');
        else
            return formatResultField(name,'Not Reviewed','fail','Scene has not been reviewed');
    };

    //#region publish
    const getPublishedStatus = async (): Promise<FieldStatus> => {

        // get all system object versions which represent changes to the
        // scene. We do this to get the earliest and current states of the scene
        const sceneSOVs: DBAPI.SystemObjectVersion[] | null = await DBAPI.SystemObjectVersion.fetchFromSystemObject(idSystemObject);
        if(!sceneSOVs || sceneSOVs.length===0) {
            RK.logError(RK.LogSection.eHTTP,'get published status failed','cannot get SystemObjectVersion for scene',{ ...scene },'HTTP.Route.ObjectStatus');
            return formatResultField('Published','Error','critical',`cannot get version for scene: ${idSystemObject}`);
        }

        // Normalize + sort newest first
        const normalizeDate = (d: string | Date) => (d instanceof Date ? d : new Date(d));
        const sorted = [...sceneSOVs].sort((a, b) =>
            normalizeDate(b.DateCreated).getTime() - normalizeDate(a.DateCreated).getTime()
        );

        // get our latest and if any are published
        const latest = sorted[0];
        const isPublished = (s: COMMON.ePublishedState) =>
            s === COMMON.ePublishedState.ePublished ||
            s === COMMON.ePublishedState.eAPIOnly ||
            s === COMMON.ePublishedState.eInternal;
        const lastPublished = sorted.find(v => isPublished(v.PublishedState)) ?? null;

        // No published versions at all
        if (!lastPublished)
            return formatResultField('Published','Unpublished','pass','Scene is not currently published');

        // figure out our latest time and when the last published one was
        const latestTime = normalizeDate(latest.DateCreated).getTime();
        const lastPubTime = normalizeDate(lastPublished.DateCreated).getTime();

        const mapStateToStatus = (s: COMMON.ePublishedState): { status: string, notes: string } => {
            switch (s) {
                case COMMON.ePublishedState.eNotPublished:
                    return { status: 'Not Published', notes: 'Scene is not published.' };
                case COMMON.ePublishedState.eAPIOnly:
                    return { status: 'Unlisted', notes: 'Scene is accessible publicly via the url, but <b><u>IS NOT</u></b> searchable via 3d.si.edu.' };
                case COMMON.ePublishedState.ePublished:
                    return { status: 'Public', notes: 'Scene is accessible publicly via the url and can be found on 3d.si.edu.' };
                case COMMON.ePublishedState.eInternal:
                    return { status: 'Internal', notes: 'Scene can only be accessed by those behind the Smithsonian firewall.' };
                default:
                    return { status: 'Unknown', notes: `Unknown published state: ${s}` };
            }
        };
        // If the latest is the last published (same object or same timestamp with published state)
        if (latestTime === lastPubTime && isPublished(latest.PublishedState)) {
            const { status, notes } = mapStateToStatus(latest.PublishedState);
            return formatResultField('Published',status,'pass',notes);
        }

        // if the latest version is after the last published and the latest is not
        // published then we have a draft.
        if (latestTime > lastPubTime && !isPublished(latest.PublishedState)) {
            return formatResultField('Published','Draft','warn','Latest scene changes have not been published');
        }

        // Otherwise, the latest is not newer than the last published (or ties but latest isn’t published),
        // so the last published remains the effective status (not a draft).
        const { status, notes } = mapStateToStatus(lastPublished.PublishedState);
        return formatResultField('Published',status,'pass',notes);
    };
    const publishedStatus: FieldStatus = await getPublishedStatus();
    const getPublishedUrl = (s: string): string | undefined => {

        const uriPath = (Config.environment.type===ENVIRONMENT_TYPE.DEVELOPMENT)
            ? 'https://api-internal.edan.si.edu/3d-api-dev/'
            : 'https://3d.si.edu/object/3d/';

        return (s.includes('Unpublished')) ?
            undefined : uriPath+scene.EdanUUID;
    };
    //#endregion

    //#region sensitivity
    const getSensitivityStatus = async (): Promise<FieldStatus> => {
        const name = 'Sensitivity';
        const properties: DBAPI.ObjectProperty[] | null = await DBAPI.ObjectProperty.fetchDerivedFromObject([idSystemObject]);
        if(!properties || properties.length<=0)
            return formatResultField(name,'Unassigned','pass','No sensitivity property assigned for this Subject.');

        const property: DBAPI.ObjectProperty = properties[0];
        if(property.PropertyType!='sensitivity')
            return formatResultField(name,'Unassigned','pass','No sensitivity property assigned for this Subject.');

        switch(property.Level) {
            case 0:
                return formatResultField(name,'Not Sensitive','pass','Subject has no restrictions in who can view its objects');
            case 1:
                return formatResultField(name,'Sensitive','pass',`Subject is sensitive. ${property.Rationale}`);
            case 2:
                return formatResultField(name,'Restricted','pass',`Subject is restricted. ${property.Rationale}`);
            default:
                return formatResultField(name,'Confidential','critical','Subject is confidential. Heavily controlled. Do not publish without explicit permission');
        }
    };
    const sensitivityStatus: FieldStatus = await getSensitivityStatus();
    //#endregion

    //#region license
    const doesLicenseAllowDownloads = (s: string): boolean => {

        // if we have standard license names, map and return
        switch(s) {
            case 'CC0, Publishable w/ Downloads':       return true;
            case 'SI ToU, Publishable w/ Downloads':    return true;
            case 'SI ToU, Publishable Only':            return false;
            case 'Restricted, Not Publishable':         return false;
        }

        // if not, see if we have the updated 'status' format and check for 'Downloads
        return s.includes('Download') ? true : false;
    };
    const getLicenseStatus = async (sensitivity: string): Promise<FieldStatus> => {
        const name = 'License';

        // grab the license assignment by SystemObject
        const assignments: DBAPI.LicenseAssignment[] | null = await DBAPI.LicenseAssignment.fetchFromSystemObject(idSystemObject);
        if(!assignments || assignments.length===0)
            return formatResultField(name,'No License','fail','No license assigned');

        // figure out what our active license is by looking for the one with no end date
        const assignment: DBAPI.LicenseAssignment | null = assignments.find(a=> {
            return !a.DateEnd;
        }) ?? null;

        const license: DBAPI.License | null = await DBAPI.License.fetch(assignment?.idLicense ?? -1);
        if(!license)
            return formatResultField(name,'No License','fail','No license assigned');

        const licenseType: string = license.Name.split(',')[0];
        const allowsDownloads: boolean = doesLicenseAllowDownloads(license.Name);
        const status: string = licenseType + ((allowsDownloads) ? ' (Downloads)' : '');

        console.log(licenseType,allowsDownloads,status,sensitivity);

        // extract the license type for status
        switch(licenseType) {
            case 'CC0': {
                if(sensitivity==='Not Sensitive' || sensitivity==='Unassigned')
                    return formatResultField(name,status,'pass','no issues with license assignment');
                else if(sensitivity==='Sensitive')
                    return formatResultField(name,status,'warn','object is sensitive. may require extra permissions to make open access.');
                else
                    return formatResultField(name,status,'fail','restricted and confidential models often cannot be CC0. double check before publishing.');
            }
            case 'SI ToU': {
                if(sensitivity==='Not Sensitive' || sensitivity==='Unassigned')
                    return formatResultField(name,status,'pass','no issues with license assignment');
                else if(sensitivity==='Sensitive')
                    return formatResultField(name,status,'pass','object is sensitive, but follows SD-609 data use policy');
                else
                    return formatResultField(name,status,'warn','restricted and confidential may require extra permissions before publishing. double check before publishing.');
            }
            case 'Restricted': {
                if(sensitivity==='Not Sensitive' || sensitivity==='Unassigned')
                    return formatResultField(name,status,'warn','no issues with license assignment');
                else if(sensitivity==='Sensitive')
                    return formatResultField(name,status,'warn','object is sensitive. may require extra permissions to make open access.');
                else
                    return formatResultField(name,status,'fail','restricted and confidential models often cannot be CC0. double check before publishing.');
            }
            default:
                return formatResultField(name,'Not Assigned','fail','No license assigned');
        }
    };
    const licenseStatus: FieldStatus = await getLicenseStatus(sensitivityStatus.status);
    //#endregion

    //#region assets
    const getCaptureDataStatus = (count: number, expected: number): FieldStatus => {
        const name = 'Capture Data';

        if (count === 0 && expected <= 0)
            return { name, status: 'Missing', level: 'fail', notes: 'no datasets found linked to the MediaGroup or source model' };
        else if(expected > 0 && count < expected)
            return { name, status: 'Error', level: 'fail', notes: `${count}/${expected} datasets found. more linked to MediaGroup than source model` };
        else if(count === expected)
            return { name, status: 'Found', level: 'pass', notes: `${count}/${expected} datasets found` };
        else if(count > expected)
            return { name, status: 'Warning', level: 'warn', notes: `${count}/${expected} datasets found. source model has unexpected dataset. (CAD?)` };
        else
            return { name, status: 'Error', level: 'fail', notes: `${count}/${expected} datasets found. unexpected relationships` };
    };
    const getModelARStatus = (status: string, licenseAllows: boolean): FieldStatus => {
        // TODO: check if downloads supported by license to determin severity
        const name = 'Models: AR';

        switch(status) {
            case 'Good':
                return { name, status: 'Found', level: 'pass', notes: 'all AR models found' };
            case 'Missing: WebAR':
                return { name, status, level: 'fail', notes: 'WebXR models are generated with the scene. Try regenerating it from the source model page' };
            case 'Missing: NativeAR':
                return { name, status, level: (licenseAllows)?'fail':'warn', notes: 'Native AR models are generated with downloads' };
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
    const getModelDownloadsStatus = ( status: string, count: number, expected: number, licenseAllows: boolean): FieldStatus => {
        const name = 'Download Models';
        if(status === ' Good') {
            if(licenseAllows===true)
                return formatResultField(name,'Found','pass','all generated downloads found for scene and will be published');
            else
                return formatResultField(name,'Found','warn','license does not allow for downloads. they <b><u>WILL NOT</u></b> be published.');
        } else {
            if(licenseAllows===true)
                return formatResultField(name,status,'fail',`downloads not found (${count}/${expected>0?expected:5})`);
            else
                return formatResultField(name,status,'warn','downloads not found. consider generating them.');
        }
    };
    const getThumbnailsStatus = async (): Promise<FieldStatus> => {
        const name = 'Thumbnails';
        return formatResultField(name,'Found','pass','not supported');
    };
    //#endregion

    // return object structure
    const result = {
        idSystemObject: systemObject.idSystemObject,
        idScene: systemObject.idScene,

        publishedUrl:
            getPublishedUrl(publishedStatus.status),
        published:
            publishedStatus,
        license:
            licenseStatus,
        reviewed:
            getReviewedStatus(sceneSummary.isReviewed),
        scale:
            formatResultField('Scene Scale','Good','pass','Scene scale aligns with units chosen'),
        thumbnails:
            await getThumbnailsStatus(),
        baseModels:
            getModelBaseStatus(sceneSummary.derivatives.models.status,sceneSummary.derivatives.models.items.length,sceneSummary.derivatives.models.expected ?? -1),
        downloads:
            getModelDownloadsStatus(sceneSummary.derivatives.downloads.status,sceneSummary.derivatives.downloads.items.length,sceneSummary.derivatives.downloads.expected ?? -1,doesLicenseAllowDownloads(licenseStatus.status)),
        arModels:
            getModelARStatus(sceneSummary.derivatives.ar.status,doesLicenseAllowDownloads(licenseStatus.status)),
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