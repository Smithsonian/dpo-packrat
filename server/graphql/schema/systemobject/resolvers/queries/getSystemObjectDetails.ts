import * as CACHE from '../../../../../cache';
import * as DBAPI from '../../../../../db';
import * as COMMON from '@dpo-packrat/common';
import {
    GetSystemObjectDetailsResult,
    IngestIdentifier,
    QueryGetSystemObjectDetailsArgs,
    RelatedObject,
    RelatedObjectType,
    RepositoryPath,
    ObjectPropertyResult
} from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';
import { SceneHelpers } from '../../../../../utils/sceneHelpers';
import { SubjectHelpers } from '../../../../../utils/subjectHelpers';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';

type PublishedStateInfo = {
    publishedState: string;
    publishedEnum: COMMON.ePublishedState;
    publishable: boolean;
    publishBlocker: string | null;
    isDraft: boolean;
    edanRecordId: string | null;
    edanRecordUrl: string | null;
    edanUnitCode: string | null;
    subjectUnitMismatch: boolean;
};

const UNKNOWN_NAME: string = '<UNKNOWN>';

export default async function getSystemObjectDetails(_: Parent, args: QueryGetSystemObjectDetailsArgs): Promise<GetSystemObjectDetailsResult> {
    const { input } = args;
    const { idSystemObject } = input;

    const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);

    const { success, error, unit, project, subject, item, objectAncestors, OGDB } = await getObjectAncestors(idSystemObject);
    if (!success) {
        const message: string = `Failed to compute ancestors: ${error}`;
        RK.logError(RK.LogSection.eGQL,'get details failed',message,{ input },'GraphQL.SystemObject.Details');
        throw new Error(message);
    }

    const systemObject: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
    const sourceObjects: RelatedObject[] = await getRelatedObjects(idSystemObject, RelatedObjectType.Source);
    const derivedObjects: RelatedObject[] = await getRelatedObjects(idSystemObject, RelatedObjectType.Derived);
    const objectVersions: DBAPI.SystemObjectVersion[] | null = await DBAPI.SystemObjectVersion.fetchFromSystemObject(idSystemObject);
    const LR: DBAPI.LicenseResolver | undefined = await CACHE.LicenseCache.getLicenseResolver(idSystemObject, OGDB);
    const publishedStateInfo: PublishedStateInfo = await getPublishedState(idSystemObject, oID, LR);
    const identifiers = await getIngestIdentifiers(idSystemObject);

    if (!oID) {
        const message: string = `No object ID found for ID: ${idSystemObject}`;
        RK.logError(RK.LogSection.eGQL,'get details failed',message,{ input },'GraphQL.SystemObject.Details');
        throw new Error(message);
    }

    if (!systemObject) {
        const message: string = `No system object found for ID: ${idSystemObject}`;
        RK.logError(RK.LogSection.eGQL,'get details failed',message,{ input },'GraphQL.SystemObject.Details');
        throw new Error(message);
    }

    if (!objectVersions) {
        const message: string = `No SystemObjectVersions found for ID: ${idSystemObject}`;
        RK.logError(RK.LogSection.eGQL,'get details failed',message,{ input },'GraphQL.SystemObject.Details');
        throw new Error(message);
    }

    const { owner: assetOwner, asset } = await computeAssetAndOwner(oID);

    const name: string = await resolveNameForObject(idSystemObject);
    const subTitle: string | null = await resolveSubtitleForObject(idSystemObject);
    // LOG.info('getSystemObjectDetails 3', LOG.LS.eGQL);

    const metadata: DBAPI.Metadata[] | null = await DBAPI.Metadata.fetchFromSystemObject(idSystemObject);
    if (!metadata) {
        const message: string = `Unable to retrieve metadata for ID: ${idSystemObject}`;
        RK.logError(RK.LogSection.eGQL,'get details failed',message,{ input },'GraphQL.SystemObject.Details');
        throw new Error(message);
    }

    // if subject is null, then we may be a subject and need to
    let idSubject: number = subject?.[0]?.idSystemObject ?? -1;
    if(idSubject<0) {
        if(systemObject.idSubject)
            idSubject = systemObject.idSystemObject;
        else
            RK.logWarning(RK.LogSection.eGQL,'get system object details warning','no subject found for object',{ systemObject },'GraphQL.SystemObject.Details');
    }

    // gather and build our object properties
    const cleanedProperties: ObjectPropertyResult[] = [];
    if(idSubject>0) {
        const properties: DBAPI.ObjectProperty[] | null = await DBAPI.ObjectProperty.fetchDerivedFromObject([idSubject]);
        if(properties) {
            // console.log('fetch obj properties; ',properties,idSystemObject);

            // grab the contact if set
            for(let i=0; i<properties.length; i++) {
                const prop = properties[i];
                const contact: DBAPI.Contact | null = await DBAPI.Contact.fetch(prop.idContact ?? 0);

                cleanedProperties.push({
                    propertyType: prop.PropertyType,
                    level: prop.Level,
                    rationale: prop.Rationale ?? 'Not Defined',
                    idContact: contact?.idContact ?? null,
                });
            }
        }
    }

    const ctx = Authorization.getContext();
    const allowed = ctx ? await Authorization.canAccessSystemObject(ctx, idSystemObject) : false;
    const allowedReason = allowed ? null : AUTH_ERROR.ACCESS_DENIED;

    return {
        idSystemObject,
        idObject: oID.idObject,
        name,
        subTitle,
        retired: systemObject.Retired,
        objectType: oID.eObjectType,
        allowed,
        allowedReason,
        publishedState: publishedStateInfo.publishedState,
        publishedEnum: publishedStateInfo.publishedEnum,
        publishable: publishedStateInfo.publishable,
        publishBlocker: publishedStateInfo.publishBlocker,
        isDraft: publishedStateInfo.isDraft,
        edanRecordId: publishedStateInfo.edanRecordId,
        edanRecordUrl: publishedStateInfo.edanRecordUrl,
        edanUnitCode: publishedStateInfo.edanUnitCode,
        subjectUnitMismatch: publishedStateInfo.subjectUnitMismatch,
        thumbnail: null,
        unit,
        project,
        subject,
        item,
        asset,
        objectAncestors,
        identifiers,
        sourceObjects,
        derivedObjects,
        objectVersions,
        metadata,
        assetOwner,
        license: LR?.License,
        licenseInheritance: LR?.inherited ? LR?.LicenseAssignment?.idSystemObject : undefined,
        objectProperties: cleanedProperties
    };
}

// A published value is any state other than Not Published (Public / Public Unlisted / Internal).
// Only these carry a live EDAN presence and can be drafted or unpublished.
export function isPublishedState(s: COMMON.ePublishedState): boolean {
    return s === COMMON.ePublishedState.ePublished ||
        s === COMMON.ePublishedState.eAPIOnly ||
        s === COMMON.ePublishedState.eInternal;
}

// Read after.eState from a publish/unpublish audit payload (shape emitted by publish.ts /
// RetireExecutorDeps.ts: { before, after: { eState, eStateName } }). Parsed defensively — an
// unreadable or unknown payload yields null so the caller drops to the legacy version-chain read.
export function parsePublishedStateFromAudit(data: string | null): COMMON.ePublishedState | null {
    if (!data)
        return null;
    try {
        const parsed = JSON.parse(data);
        const eState: unknown = parsed?.after?.eState;
        if (typeof eState !== 'number' || COMMON.ePublishedState[eState] === undefined)
            return null;
        return eState as COMMON.ePublishedState;
    } catch {
        return null;
    }
}

// Minimal SystemObjectVersion projection the derivation needs: identity (for chain ordering),
// published state, and creation time (for draft-drift detection).
export type PublishedStateVersion = {
    idSystemObjectVersion: number;
    published: COMMON.ePublishedState;
    dateCreated: Date;
};

// Pure derivation of an object's CURRENT published state + draft flag from the latest publish/unpublish
// audit event (its parsed after.eState `eventState` and timestamp `eventWhen`), the latest content
// version, and the full version chain. No DB access, so the whole publish-state matrix is unit-testable.
export function derivePublishedState(eventState: COMMON.ePublishedState | null, eventWhen: Date | null,
    latest: PublishedStateVersion | null, allVersions: PublishedStateVersion[]): { publishedEnum: COMMON.ePublishedState; isDraft: boolean } {
    // Audit-derived path: the event is the authoritative current state.
    if (eventState !== null && eventWhen !== null) {
        // Draft = currently published AND content has drifted since that publish. Publishing mutates a
        // version in place without bumping DateCreated, so a published scene with no later edits has its
        // latest SOV DateCreated before the event (not a draft); a subsequent edit rolls a newer SOV.
        const isDraft: boolean = isPublishedState(eventState) && latest !== null
            && latest.dateCreated.getTime() > eventWhen.getTime();
        return { publishedEnum: eventState, isDraft };
    }

    // Legacy fallback (no usable audit event): compute from the version chain. Current state is the
    // latest version's state; draft = latest version newer than the last published version and itself
    // not published. No regression for un-audited objects; reconciled by the EDAN sync work.
    const publishedEnum: COMMON.ePublishedState = latest ? latest.published : COMMON.ePublishedState.eNotPublished;
    let isDraft: boolean = false;
    if (allVersions.length > 0) {
        const sorted = [...allVersions].sort((a, b) => b.idSystemObjectVersion - a.idSystemObjectVersion);
        const latestV = sorted[0];
        const lastPublished = sorted.find(v => isPublishedState(v.published)) ?? null;
        if (lastPublished)
            isDraft = latestV.idSystemObjectVersion > lastPublished.idSystemObjectVersion
                && !isPublishedState(latestV.published);
    }
    return { publishedEnum, isDraft };
}

async function getPublishedState(idSystemObject: number, oID: DBAPI.ObjectIDAndType | undefined,
    LR: DBAPI.LicenseResolver | undefined): Promise<PublishedStateInfo> {
    // Current publication state is derived from the authoritative publish/unpublish audit trail rather
    // than SystemObjectVersion.PublishedState. The version field is reset to eNotPublished on every
    // content edit, so reading the latest version mislabels a still-live scene as Not Published, and
    // reading the last-published version answers "was it ever published?" not "is it published now?"
    // (an unpublish no-ops on an already-eNotPublished latest version, so it never registers). The
    // audit events are unambiguous, timestamped, and PROTECT-tier (never pruned). This is the complete
    // record of publication-state changes: any future path that writes PublishedState for a
    // publish/unpublish MUST emit eActionPublish / eActionUnpublish (today only publish.ts and
    // RetireExecutorDeps.ts do), or this label silently breaks.
    const publicationEvent: DBAPI.Audit | null = await DBAPI.Audit.fetchLatestPublicationEvent(idSystemObject);
    const eventState: COMMON.ePublishedState | null = publicationEvent ? parsePublishedStateFromAudit(publicationEvent.Data) : null;
    const useAudit: boolean = eventState !== null;

    const latestSOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(idSystemObject);
    const latest: PublishedStateVersion | null = latestSOV
        ? { idSystemObjectVersion: latestSOV.idSystemObjectVersion, published: latestSOV.publishedStateEnum(), dateCreated: latestSOV.DateCreated }
        : null;

    // The full version chain is only consulted by the legacy fallback's draft computation.
    let allVersions: PublishedStateVersion[] = [];
    if (!useAudit) {
        const versions: DBAPI.SystemObjectVersion[] | null = await DBAPI.SystemObjectVersion.fetchFromSystemObject(idSystemObject);
        allVersions = (versions ?? []).map(v => ({ idSystemObjectVersion: v.idSystemObjectVersion, published: v.publishedStateEnum(), dateCreated: v.DateCreated }));
    }

    const { publishedEnum, isDraft } = derivePublishedState(eventState,
        useAudit && publicationEvent ? publicationEvent.AuditDate : null, latest, allVersions);
    const publishedState: string = COMMON.PublishedStateEnumToString(publishedEnum);

    let publishable: boolean = false;
    let publishBlocker: string | null = null;
    let edanRecordId: string | null = null;
    let edanRecordUrl: string | null = null;
    let edanUnitCode: string | null = null;
    let subjectUnitMismatch: boolean = false;
    if (oID) {
        switch (oID.eObjectType) {
            case COMMON.eSystemObjectType.eScene: {
                const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(oID.idObject);
                if (scene) {
                    const blockers: string[] = [];

                    if (!scene.ApprovedForPublication)
                        blockers.push('Not approved for publication');
                    if (!scene.PosedAndQCd)
                        blockers.push('Not posed and QCd');

                    const mayBePublished: boolean = (LR != null) &&
                                                    (LR.License != null) &&
                                                    (DBAPI.LicenseRestrictLevelToPublishedStateEnum(LR.License.RestrictLevel) !== COMMON.ePublishedState.eNotPublished);
                    if (!mayBePublished)
                        blockers.push('License not defined or does not allow publishing');

                    const edanResult = await SceneHelpers.validateEdanRecordId(idSystemObject, oID.idObject);
                    if (!edanResult.valid)
                        blockers.push(`EDAN Record ID: ${edanResult.message}`);

                    publishable = blockers.length === 0;
                    publishBlocker = blockers.length > 0 ? blockers.join(' | ') : null;
                } else
                    RK.logError(RK.LogSection.eGQL,'get published state failed','unable to compute scene',{ idSystemObject, ...oID },'GraphQL.SystemObject.Details');
            } break;

            case COMMON.eSystemObjectType.eSubject: {
                // The EDAN Record ID Identifier is the target record and a real publish blocker:
                // no record id -> nothing to upsert.
                const target = await SubjectHelpers.computeTargetRecord(idSystemObject);
                edanRecordId = target.recordId || null;
                edanRecordUrl = target.url || null;
                edanUnitCode = target.unitCode || null;
                if (target.recordId) {
                    publishable = true;
                } else {
                    publishable = false;
                    publishBlocker = 'No EDAN Record ID';
                }

                // Warn an admin editing a Subject in a Unit they are not directly assigned to.
                // Admin context units are zeroed, so read the raw assignments.
                const ctx = Authorization.getContext();
                if (ctx?.isAdmin && oID.idObject) {
                    const subjectDB: DBAPI.Subject | null = await DBAPI.Subject.fetch(oID.idObject);
                    if (subjectDB) {
                        const ownUnits: number[] = await DBAPI.UserAuthorization.fetchUnitsForUser(ctx.idUser);
                        subjectUnitMismatch = !ownUnits.includes(subjectDB.idUnit);
                    }
                }
            } break;
        }
    }
    return { publishedState, publishedEnum, publishable, publishBlocker, isDraft,
        edanRecordId, edanRecordUrl, edanUnitCode, subjectUnitMismatch };
}

// Classifies a Model's display Type + Variant from the Model row alone. Purpose distinguishes
// Master / Scene Model / Download / Intermediate; for Downloads a null AutomationTag marks a
// custom (auxiliary) download, while a Cook-generated download carries a tag.
async function computeModelRoleVariant(model: DBAPI.Model): Promise<{ type: string; variant: string }> {
    const [vMaster, vDownload, vVoyager, vIntermediate] = await Promise.all([
        CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeMaster),
        CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeDownload),
        CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeVoyagerSceneModel),
        CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeIntermediateProcessingStep),
    ]);
    const p: number | null = model.idVPurpose;
    if (vMaster && p === vMaster.idVocabulary)
        return { type: 'Master', variant: await computeMasterVariant(model.Variant) };
    if (vDownload && p === vDownload.idVocabulary)
        return { type: 'Download', variant: (model.AutomationTag && model.AutomationTag.length > 0) ? 'Core' : 'Aux' };
    if (vVoyager && p === vVoyager.idVocabulary)
        return { type: 'Scene Model', variant: 'Core' };
    if (vIntermediate && p === vIntermediate.idVocabulary)
        return { type: 'Intermediate', variant: '' };
    return { type: '', variant: '' };
}

// Resolves a master Model's Variant JSON (array of vocab ids) to display labels.
async function computeMasterVariant(variantJSON: string): Promise<string> {
    let ids: number[] = [];
    try { ids = JSON.parse(variantJSON || '[]'); } catch { ids = []; }
    if (!Array.isArray(ids) || ids.length === 0)
        return '';
    const [vRaw, vPres] = await Promise.all([
        CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelVariantRawClean),
        CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelVariantPresentation),
    ]);
    const labels: string[] = [];
    if (vRaw && ids.includes(vRaw.idVocabulary)) labels.push('Raw Clean');
    if (vPres && ids.includes(vPres.idVocabulary)) labels.push('Presentation');
    return labels.join(', ');
}

export async function getRelatedObjects(idSystemObject: number, type: RelatedObjectType): Promise<RelatedObject[]> {
    let relatedSystemObjects: DBAPI.SystemObject[] | null = [];

    if (type === RelatedObjectType.Source) {
        relatedSystemObjects = await DBAPI.SystemObject.fetchMasterFromXref(idSystemObject);
    } else if (type === RelatedObjectType.Derived) {
        relatedSystemObjects = await DBAPI.SystemObject.fetchDerivedFromXref(idSystemObject);
    }

    if (!relatedSystemObjects) return [];

    const relatedObjects: RelatedObject[] = [];

    for (const relatedSystemObject of relatedSystemObjects) {
        const identifier: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromSystemObject(relatedSystemObject.idSystemObject);
        const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(relatedSystemObject.idSystemObject);

        if (!oID) {
            const message: string = `No object ID found for ID: ${idSystemObject}`;
            RK.logError(RK.LogSection.eGQL,'get related objects failed',message,{ type },'GraphQL.SystemObject.Details');
            throw new Error(message);
        }

        // classify Model role/variant for display (blank for non-model objects)
        let roleType: string = '';
        let roleVariant: string = '';
        if (oID.eObjectType === COMMON.eSystemObjectType.eModel) {
            const modelDB: DBAPI.Model | null = await DBAPI.Model.fetch(oID.idObject);
            if (modelDB) {
                const rv = await computeModelRoleVariant(modelDB);
                roleType = rv.type;
                roleVariant = rv.variant;
            }
        }

        const sourceObject: RelatedObject = {
            idSystemObject: relatedSystemObject.idSystemObject,
            name: await resolveNameForObject(relatedSystemObject.idSystemObject),
            identifier: identifier?.[0]?.IdentifierValue ?? null,
            objectType: oID.eObjectType,
            retired: relatedSystemObject.Retired,
            type: roleType,
            variant: roleVariant
        };

        relatedObjects.push(sourceObject);
    }

    relatedObjects.sort((a, b) => {
        if (a.objectType < b.objectType)
            return -1;
        if (a.objectType > b.objectType)
            return 1;
        return a.name.localeCompare(b.name);
    });

    return relatedObjects;
}

async function getIngestIdentifiers(idSystemObject: number): Promise<IngestIdentifier[]> {
    const identifier: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromSystemObject(idSystemObject);

    if (!identifier) return [];

    return identifier.map(({ idIdentifier, IdentifierValue, idVIdentifierType }) => ({
        idIdentifier,
        identifier: IdentifierValue,
        identifierType: idVIdentifierType
    }));
}

type GetObjectAncestorsResult = {
    success: boolean;
    error?: string;
    unit?: RepositoryPath[] | null;
    project?: RepositoryPath[] | null;
    subject?: RepositoryPath[] | null;
    item?: RepositoryPath[] | null;
    objectAncestors: RepositoryPath[][];
    OGDB?: DBAPI.ObjectGraphDatabase;
};

async function getObjectAncestors(idSystemObject: number): Promise<GetObjectAncestorsResult> {
    const OA: DBAPI.ObjectAncestors = new DBAPI.ObjectAncestors(idSystemObject, UNKNOWN_NAME);
    if (!await OA.compute())
        return { success: false, objectAncestors: [], error: 'getSystemObjectDetails failed to compute object graph' };

    return { success: true, unit: OA.unit, project: OA.project, subject: OA.subject, item: OA.item, objectAncestors: OA.ancestorStack, OGDB: OA.OGDB };
}

async function resolveNameForObject(idSystemObject: number): Promise<string> {
    const name: string | undefined = await CACHE.SystemObjectCache.getObjectNameByID(idSystemObject);
    return name ?? UNKNOWN_NAME;
}

async function resolveSubtitleForObject(idSystemObject: number): Promise<string | null> {
    const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
    if (!oID) {
        RK.logError(RK.LogSection.eGQL,'resolve subtitle failed','failed to compute object ID and type',{ idSystemObject },'GraphQL.SystemObject.Details');
        return null;
    }

    switch (oID.eObjectType) {
        case COMMON.eSystemObjectType.eItem: {
            const item: DBAPI.Item | null = await DBAPI.Item.fetch(oID.idObject);
            if (!item) {
                RK.logError(RK.LogSection.eGQL,'resovle subtitle failed','unable to load item with id',{ ...oID },'GraphQL.SystemObject.Details');
                return null;
            }
            return item.Title;
        }

        case COMMON.eSystemObjectType.eModel: {
            const model: DBAPI.Model | null = await DBAPI.Model.fetch(oID.idObject);
            if (!model) {
                RK.logError(RK.LogSection.eGQL,'resovle subtitle failed','unable to load model with id',{ ...oID },'GraphQL.SystemObject.Details');
                return null;
            }
            return model.Title;
        }

        case COMMON.eSystemObjectType.eScene: {
            const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(oID.idObject);
            if (!scene) {
                RK.logError(RK.LogSection.eGQL,'resovle subtitle failed','unable to load scene with id',{ ...oID },'GraphQL.SystemObject.Details');
                return null;
            }
            return scene.Title;
        }
    }
    return null;
}

async function computeAssetAndOwner(oID: DBAPI.ObjectIDAndType): Promise<{ owner: RepositoryPath | undefined, asset: RepositoryPath | undefined }> {
    let idAsset: number | undefined = undefined;
    let owner: RepositoryPath | undefined = undefined;
    let asset: RepositoryPath | undefined = undefined;

    switch (oID.eObjectType) {
        case COMMON.eSystemObjectType.eAsset:
            idAsset = oID.idObject;
            break;

        case COMMON.eSystemObjectType.eAssetVersion: {
            const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(oID.idObject);
            if (!assetVersion)
                RK.logError(RK.LogSection.eGQL,'compute asset failed','failed to load asset version with id',{ ...oID },'GraphQL.SystemObject.Details');
            else
                idAsset = assetVersion.idAsset;
        } break;
    }

    if (!idAsset)
        return { owner, asset };

    const assetDB: DBAPI.Asset | null = await DBAPI.Asset.fetch(idAsset);
    if (!assetDB) {
        RK.logError(RK.LogSection.eGQL,'compute asset failed','failed to load asset with id',{ idAsset },'GraphQL.SystemObject.Details');
        return { owner, asset };
    }

    const SOAsset: DBAPI.SystemObject | null = await DBAPI.SystemObjectPairs.fetchFromAssetID(assetDB.idAsset);
    if (!SOAsset) {
        RK.logError(RK.LogSection.eGQL,'compute asset failed','failed to load system object for asset with id',{ idAsset },'GraphQL.SystemObject.Details');
        return { owner, asset };
    }

    const assetName: string = await resolveNameForObject(SOAsset.idSystemObject);
    asset = { idSystemObject: SOAsset.idSystemObject, name: assetName ?? '', objectType: COMMON.eSystemObjectType.eAsset };

    if (!assetDB.idSystemObject)
        return { owner, asset };

    const oIDParent: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(assetDB.idSystemObject);
    if (!oIDParent) {
        RK.logError(RK.LogSection.eGQL,'compute asset failed','failed to load system object information for idSystemObject',{ ...assetDB },'GraphQL.SystemObject.Details');
        return { owner, asset };
    }

    const name: string = await resolveNameForObject(assetDB.idSystemObject);
    owner = { idSystemObject: assetDB.idSystemObject, name, objectType: oIDParent.eObjectType };
    return { owner, asset };
}