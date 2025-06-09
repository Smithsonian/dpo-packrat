/* eslint-disable @typescript-eslint/no-explicit-any */
import { RollbackAssetVersionResult, MutationRollbackAssetVersionArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as STORE from '../../../../../storage/interface';
import * as H from '../../../../../utils/helpers';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

export default async function rollbackAssetVersion(_: Parent, args: MutationRollbackAssetVersionArgs, context: Context): Promise<RollbackAssetVersionResult> {
    const { input } = args;
    const { idAssetVersion, rollbackNotes } = input;
    const { user } = context;
    if (!user)
        return sendResponse(false,'rollback asset version failed','unable to detemine user from context');

    const assetVersionOrig: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion);
    if (!assetVersionOrig)
        return sendResponse(false,'rollback asset version failed',`unable to load AssetVersion for idAssetVersion ${idAssetVersion}`);

    const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersionOrig.idAsset);
    if (!asset)
        return sendResponse(false,'rollback asset version failed',`unable to load asset for ${assetVersionOrig.idAsset}`);

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

    return sendResponse(true,'rollback asset version success',undefined,{ ...args.input });
}

function sendResponse(success: boolean, message: string, reason?: string, data?: any): RollbackAssetVersionResult {
    if (!success)
        RK.logError(RK.LogSection.eGQL,message,reason,data,'GraphQL.Asset');
    return { success, message };
}