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
import { SceneHelpers, EdanRecordIdResult } from '../../../utils/sceneHelpers';

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

const formatEdanResultField = (name: string, status: string, level: 'pass' | 'fail' | 'warn' | 'critical', notes: string): FieldStatus => {
    return { name, status, level, notes };
};
const getEdanRecordIdStatus = (r: EdanRecordIdResult): FieldStatus => {
    const name = 'EDAN Record ID';
    switch (r.status) {
        case 'error':
            return formatEdanResultField(name, 'Error', 'fail', r.message);
        case 'no_subject':
            return formatEdanResultField(name, 'No Subject', 'fail', r.message);
        case 'assigned_multisubject':
            return formatEdanResultField(name, 'Assigned (Multi-Subject)', 'pass', r.message);
        case 'invalid_multisubject':
            return formatEdanResultField(name, 'Invalid for Multi-Subject', 'fail', r.message);
        case 'missing_multisubject':
            return formatEdanResultField(name, 'Missing for Multi-Subject', 'fail', r.message);
        case 'assigned':
            return formatEdanResultField(name, 'Assigned', 'pass', r.message);
        case 'mismatch':
            return formatEdanResultField(name, 'Mismatch', 'fail', r.message);
        case 'missing_svx':
            return formatEdanResultField(name, 'Missing in SVX', 'fail', r.message);
        case 'missing_db':
            return formatEdanResultField(name, 'Missing in DB', 'fail', r.message);
        case 'not_found':
            return formatEdanResultField(name, 'Not Found', 'fail', r.message);
        default:
            return formatEdanResultField(name, 'Unknown', 'fail', r.message);
    }
};

export async function getObjectStatus(req: Request, res: Response): Promise<void> {

    // make sure we're authorized to run this routine
    const authResult = await isAuthorized(req,false);
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
    const getReviewedStatus = async (isReviewed: boolean): Promise<FieldStatus> => {
        const name = 'Is Reviewed';
        if(isReviewed) {
            const reviewer: DBAPI.User | null = await DBAPI.Audit.fetchLastUser(idSystemObject, DBAPI.eAuditType.eSceneQCd);
            const notes = reviewer ? `Marked as reviewed by ${reviewer.Name}` : 'Marked as reviewed';
            return formatResultField(name,'Reviewed','pass',notes);
        } else
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

        // Sort by idSystemObjectVersion descending (newest/highest ID first)
        // This matches how fetchLatestFromSystemObject determines the "latest" version
        const sorted = [...sceneSOVs].sort((a, b) =>
            b.idSystemObjectVersion - a.idSystemObjectVersion
        );

        // get our latest (highest ID) and find if any version is published
        const latest = sorted[0];
        const isPublished = (s: COMMON.ePublishedState) =>
            s === COMMON.ePublishedState.ePublished ||
            s === COMMON.ePublishedState.eAPIOnly ||
            s === COMMON.ePublishedState.eInternal;
        const lastPublished = sorted.find(v => isPublished(v.PublishedState)) ?? null;

        // No published versions at all
        if (!lastPublished)
            return formatResultField('Published','Unpublished','pass','Scene is not currently published');

        // Compare version IDs to determine if we have unpublished changes (draft)
        const latestId = latest.idSystemObjectVersion;
        const lastPubId = lastPublished.idSystemObjectVersion;

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
        // If the latest version is the last published one (same ID means current version is published)
        if (latestId === lastPubId && isPublished(latest.PublishedState)) {
            const { status, notes } = mapStateToStatus(latest.PublishedState);
            return formatResultField('Published',status,'pass',notes);
        }

        // If the latest version ID is greater than the last published version ID and the latest
        // is not published, then we have unpublished changes (a draft)
        if (latestId > lastPubId && !isPublished(latest.PublishedState)) {
            return formatResultField('Published','Draft','warn','Latest scene changes have not been published');
        }

        // Otherwise, the latest is not newer than the last published (or ties but latest isn't published),
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
        const name = 'Models: AR';

        switch(status) {
            case 'Good':
                return { name, status: 'Found', level: 'pass', notes: 'all AR models found' };
            case 'Missing: WebAR':
                return { name, status, level: 'fail', notes: 'WebXR models are generated with the scene. Try regenerating it from the source model page' };
            case 'Missing: NativeAR':
                return { name, status, level: (licenseAllows)?'fail':'warn', notes: 'Native AR models are generated with downloads' };
            case 'Missing: All':
                return { name, status, level: (licenseAllows)?'fail':'warn', notes: 'no AR models found. Regenerate the scene and generate downloads' };
            default: {
                if (status.startsWith('Error:'))
                    return { name, status: 'Outdated', level: 'warn', notes: `AR model may have material issues. Consider regenerating. (${status})` };
                return { name, status: 'Error', level: 'critical', notes: `unexpected AR model status: ${status}` };
            }
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
        const expectedCount = expected > 0 ? expected : 6;

        if(status === 'Good') {
            if(licenseAllows===true)
                return formatResultField(name,'Found','pass','all generated downloads found for scene and will be published');
            else
                return formatResultField(name,'Found','warn','license does not allow for downloads. they <b><u>WILL NOT</u></b> be published.');
        } else if(status === 'Missing') {
            // downloads are actually missing (count < 6)
            if(licenseAllows===true)
                return formatResultField(name,'Missing','fail',`downloads not found (${count}/${expectedCount})`);
            else
                return formatResultField(name,'Missing','warn',`downloads not found (${count}/${expectedCount}). consider generating them.`);
        } else if(status === 'Error') {
            // downloads exist but may have material issues (created before June 14, 2024 Cook fix)
            if(licenseAllows===true)
                return formatResultField(name,'Outdated','warn',`downloads found (${count}/${expectedCount}) but may have material issues. consider regenerating.`);
            else
                return formatResultField(name,'Outdated','warn',`downloads found (${count}/${expectedCount}) but may have issues. license does not allow publishing.`);
        } else {
            // fallback for unexpected status values
            if(licenseAllows===true)
                return formatResultField(name,status,'fail',`unexpected download status (${count}/${expectedCount})`);
            else
                return formatResultField(name,status,'warn',`unexpected download status (${count}/${expectedCount})`);
        }
    };
    const getThumbnailsStatus = async (): Promise<FieldStatus> => {
        const name = 'Thumbnails';
        return formatResultField(name,'Found','pass','not supported');
    };
    //#endregion

    //#region edanRecordId
    const edanResult: EdanRecordIdResult = await SceneHelpers.validateEdanRecordId(idSystemObject, scene.idScene);
    const edanRecordIdStatus: FieldStatus = getEdanRecordIdStatus(edanResult);
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
            await getReviewedStatus(sceneSummary.isReviewed),
        edanRecordId:
            edanRecordIdStatus,
        edanRecordIdRaw: {
            svx: edanResult.svxEdanRecordId,
            db: edanResult.dbEdanRecordId,
            subjectCount: edanResult.subjectCount,
        },
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

//#region PATCH OBJECT
export async function patchObject(req: Request, res: Response): Promise<void> {

    // make sure we're authorized to run this routine
    const authResult = await isAuthorized(req, false);
    if(authResult.success===false) {
        res.status(200).send(JSON.stringify(generateResponse(false,`patchObject: ${authResult.error}`)));
        return;
    }

    try {
        const { id } = req.params;
        const idSystemObject: number = parseInt(id);
        if(isNaN(idSystemObject) || idSystemObject <= 0) {
            res.status(200).send(JSON.stringify(generateResponse(false,'patchObject: invalid idSystemObject')));
            return;
        }

        const { fields } = req.body ?? {};
        if(!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
            res.status(200).send(JSON.stringify(generateResponse(false,'patchObject: fields object required with at least one key')));
            return;
        }

        // verify it's a scene
        const systemObject: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
        if(!systemObject || !systemObject.idScene) {
            res.status(200).send(JSON.stringify(generateResponse(false,'patchObject: only Scene objects are supported')));
            return;
        }

        const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(systemObject.idScene);
        if(!scene) {
            res.status(200).send(JSON.stringify(generateResponse(false,`patchObject: cannot fetch scene ${systemObject.idScene}`)));
            return;
        }

        // get user id
        const LS = ASL.getStore();
        const idUser: number = LS?.idUser ?? 0;
        if(!idUser) {
            res.status(200).send(JSON.stringify(generateResponse(false,'patchObject: cannot determine user')));
            return;
        }

        // dispatch by field key
        const fieldKeys = Object.keys(fields);
        for (const key of fieldKeys) {
            switch(key) {
                case 'edanRecordId': {
                    const newValue = fields[key];
                    if(typeof newValue !== 'string' || newValue.trim().length === 0) {
                        res.status(200).send(JSON.stringify(generateResponse(false,'patchObject: edanRecordId must be a non-empty string')));
                        return;
                    }

                    // patch the SVX file
                    const patchResult = await SceneHelpers.patchSvxEdanRecordId(idSystemObject, scene, newValue.trim(), idUser);
                    if(!patchResult.success) {
                        res.status(200).send(JSON.stringify(generateResponse(false,`patchObject: ${patchResult.error}`)));
                        return;
                    }

                    // re-validate to get updated status
                    const edanResult: EdanRecordIdResult = await SceneHelpers.validateEdanRecordId(idSystemObject, systemObject.idScene);
                    const updatedStatus: FieldStatus = getEdanRecordIdStatus(edanResult);

                    res.status(200).send(JSON.stringify(generateResponse(true, 'Updated', {
                        edanRecordId: updatedStatus,
                        edanRecordIdRaw: {
                            svx: edanResult.svxEdanRecordId,
                            db: edanResult.dbEdanRecordId,
                            subjectCount: edanResult.subjectCount,
                        }
                    })));
                    return;
                }
                default:
                    res.status(200).send(JSON.stringify(generateResponse(false,`patchObject: unsupported field '${key}'`)));
                    return;
            }
        }
    } catch(err) {
        const error = H.Helpers.getErrorString(err);
        RK.logError(RK.LogSection.eHTTP,'patch object',`failed: ${error}`,H.Helpers.cleanExpressRequest(req,false,true,true));
        res.status(200).send(JSON.stringify(generateResponse(false,`patchObject failed: ${error}`)));
    }
}
//#endregion

//#region CONTACT
export async function createContact(req: Request, res: Response): Promise<void> {
    // make sure we're authorized to run this routine
    const authResult = await isAuthorized(req, false);
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
    const authResult = await isAuthorized(req, false);
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
    const authResult = await isAuthorized(req, false);
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
    const authResult = await isAuthorized(req,false);
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
const isAuthorized = async (req: Request, adminOnly: boolean = true): Promise<H.IOResults> => {

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
    if(adminOnly) {
        const authorizedUsers: number[] = [...new Set([...Config.auth.users.admin, ...Config.auth.users.tools])];
        if(!authorizedUsers.includes(LS.idUser)) {
            RK.logError(RK.LogSection.eHTTP,'is authorized failed','user is not authorized for this request',{},'HTTP.Route.Project');
            return { success: false, error: `user (${LS.idUser}) does not have permission.` };
        }
    }

    return { success: true };
};
//#endregion