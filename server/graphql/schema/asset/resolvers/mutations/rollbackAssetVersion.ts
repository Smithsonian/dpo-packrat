/* eslint-disable @typescript-eslint/no-explicit-any */
import { RollbackAssetVersionResult, MutationRollbackAssetVersionArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as STORE from '../../../../../storage/interface';
import * as H from '../../../../../utils/helpers';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';
import { AuditFactory } from '../../../../../audit/interface/AuditFactory';
import { eAuditType } from '../../../../../db/api/ObjectType';
import * as COMMON from '@dpo-packrat/common';

// Not wrapped in withAuditTransaction: the body streams file content from
// storage into a new asset version (potentially many MB), then calls
// AssetStorageAdapter.ingestAsset which performs storage promotion + multiple
// DB writes. Holding a Prisma transaction open across that streaming would
// blow past the statement timeout and hold table locks for orders of magnitude
// longer than necessary. CRUD audit rows for the new AssetVersion and
// SystemObjectVersion are still emitted via the standard DBObject path; the
// supplementary semantic eActionRollbackAssetVersion row is appended after.
export default async function rollbackAssetVersion(_: Parent, args: MutationRollbackAssetVersionArgs, context: Context): Promise<RollbackAssetVersionResult> {
    const { input } = args;
    const { idAssetVersion, rollbackNotes } = input;
    const { user } = context;
    if (!user)
        return sendResponse(false,'rollback asset version failed','unable to detemine user from context');

    if (!rollbackNotes || rollbackNotes.trim().length === 0)
        return sendResponse(false, 'rollback asset version failed', 'rollbackNotes is required');

    const assetVersionOrig: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion);
    if (!assetVersionOrig)
        return sendResponse(false,'rollback asset version failed',`unable to load AssetVersion for idAssetVersion ${idAssetVersion}`);

    const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersionOrig.idAsset);
    if (!asset)
        return sendResponse(false,'rollback asset version failed',`unable to load asset for ${assetVersionOrig.idAsset}`);

    // Authorization: check access to the asset's parent SystemObject
    if (asset.idSystemObject) {
        const ctx = Authorization.getContext();
        if (!ctx || !await Authorization.canAccessSystemObject(ctx, asset.idSystemObject))
            return sendResponse(false, 'rollback asset version failed', AUTH_ERROR.ACCESS_DENIED);
    }

    let SOBased: DBAPI.SystemObjectBased | null = null;
    if (asset.idSystemObject) {
        const SOPair: DBAPI.SystemObjectPairs | null = await DBAPI.SystemObjectPairs.fetch(asset.idSystemObject);
        if (!SOPair)
            return sendResponse(false,'rollback asset version failed',`unable to load system object pair info for ${asset.idSystemObject}`);
        SOBased = SOPair.SystemObjectBased;
    }

    const storage: STORE.IStorage | null = await STORE.StorageFactory.getInstance();
    if (!storage)
        return sendResponse(false,'rollback asset version failed','unable to obtain storage instance');

    // get readstream for the asset version to which we're rolling back
    const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersionByID(assetVersionOrig.idAssetVersion);
    if (!RSR.success || !RSR.readStream)
        return sendResponse(false,'rollback asset version failed',`unable to obtain readstream from rollback asset version: ${RSR.error}`,{ assetVersionOrig });

    // get write stream from our new version
    const wsRes: STORE.WriteStreamResult = await storage.writeStream(assetVersionOrig.FileName);
    if (!wsRes.success || !wsRes.storageKey || !wsRes.writeStream)
        return sendResponse(false,'rollback asset version failed',`unable to obtain storage write stream: ${wsRes.error}`);

    // write bits to writeStream
    try {
        const wrRes: H.IOResults = await H.Helpers.writeStreamToStream(RSR.readStream, wsRes.writeStream);
        if (!wrRes.success)
            return sendResponse(false,'rollback asset version failed',`unable to write rollback bits to storage: ${wrRes.error}`);
    } finally {
        wsRes.writeStream.end();
    }

    const opInfo: STORE.OperationInfo = {
        message: rollbackNotes ? rollbackNotes : `Rolling back ${assetVersionOrig.FileName} to version ${assetVersionOrig.Version}`,
        idUser: user.idUser,
        userEmailAddress: user.EmailAddress,
        userName: user.Name
    };
    const ASCNAI: STORE.AssetStorageCommitNewAssetVersionInput = {
        storageKey: wsRes.storageKey,
        storageHash: assetVersionOrig.StorageHash,
        asset,
        FilePath: assetVersionOrig.FilePath,
        idSOAttachment: assetVersionOrig.idSOAttachment,
        assetNameOverride: assetVersionOrig.FileName,
        opInfo,
        DateCreated: new Date()
    };

    // commit uploaded bits to staging storage
    const comRes: STORE.AssetStorageResultCommit = await STORE.AssetStorageAdapter.commitNewAssetVersion(ASCNAI);
    if (!comRes.success || !comRes.assetVersions || comRes.assetVersions.length <= 0)
        return sendResponse(false,'rollback asset version failed',`unable to commit new asset: ${comRes.error}`);

    if (comRes.assetVersions.length !== 1)
        return sendResponse(false,'rollback asset version failed','produced too many asset versions',{ assetVersions: comRes.assetVersions });

    const ingestAssetInput: STORE.IngestAssetInput = {
        asset,
        assetVersion: comRes.assetVersions[0],
        allowZipCracking: false,
        SOBased,
        idSystemObject: null,
        opInfo,
        Comment: opInfo.message,
        doNotSendIngestionEvent: true
    };

    // ingest uploaded asset; this creates a new asset version, promotes content into storage, and updates affected system objects with a new system object version:
    const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestAsset(ingestAssetInput);
    if (!IAR.success)
        return sendResponse(false,'rollback asset version failed',`failed to ingest rolled back asset ${IAR.error}`);

    const newAssetVersion: DBAPI.AssetVersion | undefined = IAR.assetVersions && IAR.assetVersions.length > 0 ? IAR.assetVersions[0] : undefined;
    await AuditFactory.emitSemantic({
        action: eAuditType.eActionRollbackAssetVersion,
        target: { idObject: asset.idAsset, eObjectType: COMMON.eSystemObjectType.eAsset },
        idSystemObject: asset.idSystemObject ?? null,
        payload: {
            rollbackNotes,
            from: { idAssetVersion: assetVersionOrig.idAssetVersion, Version: assetVersionOrig.Version, FileName: assetVersionOrig.FileName },
            to:   newAssetVersion ? { idAssetVersion: newAssetVersion.idAssetVersion, Version: newAssetVersion.Version, FileName: newAssetVersion.FileName } : null,
        },
    });

    return sendResponse(true,'rollback asset version success',undefined,{ ...args.input });
}

function sendResponse(success: boolean, message: string, reason?: string, data?: any): RollbackAssetVersionResult {
    if (!success)
        RK.logError(RK.LogSection.eGQL,message,reason,data,'GraphQL.Asset');
    return { success, message };
}