import * as CACHE from '../../../../../cache';
import * as DBAPI from '../../../../../db';
import * as COMMON from '../../../../../../client/src/types/server';
import {
    GetSystemObjectDetailsResult,
    IngestIdentifier,
    QueryGetSystemObjectDetailsArgs,
    RelatedObject,
    RelatedObjectType,
    RepositoryPath,
    SystemObject
} from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as LOG from '../../../../../utils/logger';

type PublishedStateInfo = {
    publishedState: string;
    publishedEnum: COMMON.ePublishedState;
    publishable: boolean;
};

const UNKNOWN_NAME: string = '<UNKNOWN>';

export default async function getSystemObjectDetails(_: Parent, args: QueryGetSystemObjectDetailsArgs): Promise<GetSystemObjectDetailsResult> {
    const { input } = args;
    const { idSystemObject } = input;
    // LOG.info('getSystemObjectDetails 0', LOG.LS.eGQL);

    const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
    // LOG.info('getSystemObjectDetails 1', LOG.LS.eGQL);

    const { success, error, unit, project, subject, item, objectAncestors, OGDB } = await getObjectAncestors(idSystemObject);
    if (!success) {
        const message: string = `Failed to compute ancestors: ${error}`;
        LOG.error(message, LOG.LS.eGQL);
        throw new Error(message);
    }
    // LOG.info('getSystemObjectDetails 2', LOG.LS.eGQL);

    const systemObject: SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
    const sourceObjects: RelatedObject[] = await getRelatedObjects(idSystemObject, RelatedObjectType.Source);
    const derivedObjects: RelatedObject[] = await getRelatedObjects(idSystemObject, RelatedObjectType.Derived);
    const objectVersions: DBAPI.SystemObjectVersion[] | null = await DBAPI.SystemObjectVersion.fetchFromSystemObject(idSystemObject);
    const LR: DBAPI.LicenseResolver | undefined = await CACHE.LicenseCache.getLicenseResolver(idSystemObject, OGDB);
    const publishedStateInfo: PublishedStateInfo = await getPublishedState(idSystemObject, oID, LR);
    const identifiers = await getIngestIdentifiers(idSystemObject);

    if (!oID) {
        const message: string = `No object ID found for ID: ${idSystemObject}`;
        LOG.error(message, LOG.LS.eGQL);
        throw new Error(message);
    }

    if (!systemObject) {
        const message: string = `No system object found for ID: ${idSystemObject}`;
        LOG.error(`getSystemObjectDetails: ${message}`, LOG.LS.eGQL);
        throw new Error(message);
    }

    if (!objectVersions) {
        const message: string = `No SystemObjectVersions found for ID: ${idSystemObject}`;
        LOG.error(`getSystemObjectDetails: ${message}`, LOG.LS.eGQL);
        throw new Error(message);
    }

    const { owner: assetOwner, asset } = await computeAssetAndOwner(oID);

    const name: string = await resolveNameForObject(idSystemObject);
    // LOG.info('getSystemObjectDetails 3', LOG.LS.eGQL);

    const metadata: DBAPI.Metadata[] | null = await DBAPI.Metadata.fetchFromSystemObject(idSystemObject);
    if (!metadata) {
        const message: string = `Unable to retrieve metadata for ID: ${idSystemObject}`;
        LOG.error(`getSystemObjectDetails: ${message}`, LOG.LS.eGQL);
        throw new Error(message);
    }

    return {
        idSystemObject,
        idObject: oID.idObject,
        name,
        retired: systemObject.Retired,
        objectType: oID.eObjectType,
        allowed: true, // TODO: True until Access control is implemented (Post MVP)
        publishedState: publishedStateInfo.publishedState,
        publishedEnum: publishedStateInfo.publishedEnum,
        publishable: publishedStateInfo.publishable,
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
    };
}

async function getPublishedState(idSystemObject: number, oID: DBAPI.ObjectIDAndType | undefined,
    LR: DBAPI.LicenseResolver | undefined): Promise<PublishedStateInfo> {
    const systemObjectVersion: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(idSystemObject);
    const publishedEnum: COMMON.ePublishedState = systemObjectVersion ? systemObjectVersion.publishedStateEnum() : COMMON.ePublishedState.eNotPublished;
    const publishedState: string = COMMON.PublishedStateEnumToString(publishedEnum);

    let publishable: boolean = false;
    if (oID) {
        switch (oID.eObjectType) {
            case COMMON.eSystemObjectType.eScene: {
                const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(oID.idObject);
                if (scene) {
                    const mayBePublished: boolean = (LR != null) &&
                                                    (LR.License != null) &&
                                                    (DBAPI.LicenseRestrictLevelToPublishedStateEnum(LR.License.RestrictLevel) !== COMMON.ePublishedState.eNotPublished);
                    publishable = scene.ApprovedForPublication && // Approved for Publication
                                  scene.PosedAndQCd &&            // Posed and QCd
                                  mayBePublished;                 // License defined and allows publishing
                } else
                    LOG.error(`Unable to compute scene for ${JSON.stringify(oID)}`, LOG.LS.eGQL);
            } break;

            case COMMON.eSystemObjectType.eSubject:
                publishable = true;
                break;
        }
    }
    return { publishedState, publishedEnum, publishable };
}

export async function getRelatedObjects(idSystemObject: number, type: RelatedObjectType): Promise<RelatedObject[]> {
    let relatedSystemObjects: SystemObject[] | null = [];

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
            LOG.error(message, LOG.LS.eGQL);
            throw new Error(message);
        }

        const sourceObject: RelatedObject = {
            idSystemObject: relatedSystemObject.idSystemObject,
            name: await resolveNameForObject(relatedSystemObject.idSystemObject),
            identifier: identifier?.[0]?.IdentifierValue ?? null,
            objectType: oID.eObjectType
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
    unit?: RepositoryPath | null;
    project?: RepositoryPath | null;
    subject?: RepositoryPath | null;
    item?: RepositoryPath | null;
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
                LOG.error(`getSystemObjectDetails: failed to load asset version with id ${oID.idObject}`, LOG.LS.eGQL);
            else
                idAsset = assetVersion.idAsset;
        } break;
    }

    if (!idAsset)
        return { owner, asset };

    const assetDB: DBAPI.Asset | null = await DBAPI.Asset.fetch(idAsset);
    if (!assetDB) {
        LOG.error(`getSystemObjectDetails: failed to load asset with id ${idAsset}`, LOG.LS.eGQL);
        return { owner, asset };
    }

    const SOAsset: DBAPI.SystemObject | null = await DBAPI.SystemObjectPairs.fetchFromAssetID(assetDB.idAsset);
    if (!SOAsset) {
        LOG.error(`getSystemObjectDetails: failed to load system object for asset with id ${idAsset}`, LOG.LS.eGQL);
        return { owner, asset };
    }

    const assetName: string | undefined = await resolveNameForObject(SOAsset.idSystemObject);
    asset = { idSystemObject: SOAsset.idSystemObject, name: assetName ?? '', objectType: COMMON.eSystemObjectType.eAsset };

    if (!assetDB.idSystemObject)
        return { owner, asset };

    const oIDParent: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(assetDB.idSystemObject);
    if (!oIDParent) {
        LOG.error(`getSystemObjectDetails: failed to load system object information for idSystemObject ${assetDB.idSystemObject}`, LOG.LS.eGQL);
        return { owner, asset };
    }

    const name: string = await resolveNameForObject(assetDB.idSystemObject);
    owner = { idSystemObject: assetDB.idSystemObject, name, objectType: oIDParent.eObjectType };
    return { owner, asset };
}