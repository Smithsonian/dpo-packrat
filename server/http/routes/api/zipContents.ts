/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /api/zip-contents/:idAssetVersion
 *
 * Returns the central-directory listing of a ZIP asset version. Used by the
 * client-side ZIP contents viewer on the asset detail page and by the
 * volumetric ingestion form to surface companion scan sheets / logs.
 *
 * Response shape: { success, message?, data: { entries[], totalUncompressedSize, entryCount } }
 */
import * as DBAPI from '../../../db';
import * as STORE from '../../../storage/interface';
import * as H from '../../../utils/helpers';
import * as path from 'path';
import { ASL, LocalStore } from '../../../utils/localStore';
import { isAuthenticated } from '../../auth';
import { Request, Response } from 'express';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { ZipFile } from '../../../utils/zipFile';
import { Authorization, AUTH_ERROR } from '../../../auth/Authorization';

type ZipContentEntry = {
    path: string;
    fileName: string;
    size: number;
    compressedSize: number;
};

type ZipContentsData = {
    entries: ZipContentEntry[];
    totalUncompressedSize: number;
    entryCount: number;
};

type ZipContentsResponse = {
    success: boolean;
    message?: string;
    data?: ZipContentsData;
};

const generateResponse = (success: boolean, message?: string, data?: ZipContentsData): ZipContentsResponse => ({ success, message, data });

const isAuthorized = async (req: Request): Promise<H.IOResults> => {
    if (!isAuthenticated(req)) {
        RK.logError(RK.LogSection.eHTTP, 'is authorized failed', 'not authenticated', {}, 'HTTP.Route.ZipContents');
        return { success: false, error: 'not authenticated' };
    }
    const LS: LocalStore | undefined = ASL.getStore();
    if (!LS || !LS.idUser) {
        RK.logError(RK.LogSection.eHTTP, 'is authorized failed', 'no LocalStore or idUser', {}, 'HTTP.Route.ZipContents');
        return { success: false, error: 'missing local store/user' };
    }
    return { success: true };
};

export async function getZipContents(req: Request, res: Response): Promise<void> {
    const authResult = await isAuthorized(req);
    if (!authResult.success) {
        res.status(200).send(JSON.stringify(generateResponse(false, `getZipContents: ${authResult.error}`)));
        return;
    }

    const idAssetVersion: number = parseInt(req.params.idAssetVersion, 10);
    if (!Number.isFinite(idAssetVersion) || idAssetVersion <= 0) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'invalid idAssetVersion')));
        return;
    }

    const resolved = await resolveAssetVersionLocalPath(idAssetVersion);
    if (!resolved.filePath) {
        res.status(200).send(JSON.stringify(generateResponse(false, resolved.error ?? 'failed to resolve asset path')));
        return;
    }

    // Authorize against the SystemObject that owns the AssetVersion.
    const ctx = Authorization.getContext();
    if (!ctx || !resolved.idSystemObject || !await Authorization.canAccessSystemObject(ctx, resolved.idSystemObject)) {
        res.status(200).send(JSON.stringify(generateResponse(false, AUTH_ERROR.ACCESS_DENIED)));
        return;
    }

    if (path.extname(resolved.filePath).toLowerCase() !== '.zip') {
        res.status(200).send(JSON.stringify(generateResponse(false, 'asset is not a ZIP archive')));
        return;
    }

    const zip = new ZipFile(resolved.filePath);
    const load = await zip.load();
    if (!load.success) {
        res.status(200).send(JSON.stringify(generateResponse(false, `failed to open ZIP: ${load.error}`)));
        return;
    }

    try {
        const fileEntries: string[] = await zip.getJustFiles(null);
        const entries: ZipContentEntry[] = [];
        let totalUncompressedSize: number = 0;

        for (const entryPath of fileEntries) {
            const md = await zip.getEntryMetadata(entryPath);
            if (!md) continue;
            entries.push({
                path: entryPath,
                fileName: path.basename(entryPath),
                size: md.size,
                compressedSize: md.compressedSize,
            });
            totalUncompressedSize += md.size;
        }

        res.status(200).send(JSON.stringify(generateResponse(true, 'ZIP contents', {
            entries,
            totalUncompressedSize,
            entryCount: entries.length,
        })));
    } catch (err) {
        RK.logError(RK.LogSection.eHTTP, 'zip contents failed', H.Helpers.getErrorString(err),
            { idAssetVersion, filePath: resolved.filePath }, 'HTTP.Route.ZipContents');
        res.status(200).send(JSON.stringify(generateResponse(false, `unexpected error: ${H.Helpers.getErrorString(err)}`)));
    } finally {
        await zip.close();
    }
}

/**
 * Resolve an idAssetVersion to a local-filesystem path plus the SystemObject
 * id used for authorization. Handles both staged and ingested asset versions
 * by consulting `AssetVersion.Ingested` and walking the right storage helper.
 */
export async function resolveAssetVersionLocalPath(idAssetVersion: number): Promise<{ filePath: string | null; idSystemObject?: number; error?: string }> {
    const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion);
    if (!assetVersion)
        return { filePath: null, error: `AssetVersion ${idAssetVersion} not found` };

    const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
    if (!asset)
        return { filePath: null, error: `Asset ${assetVersion.idAsset} not found` };

    const storage: STORE.IStorage | null = await STORE.StorageFactory.getInstance();
    if (!storage)
        return { filePath: null, error: 'Storage unavailable' };

    // Asset.idSystemObject is the asset's owner pointer, null until the asset is ingested
    // and attached to its parent object. For a staged (not-yet-ingested) asset version,
    // fall back to the AssetVersion's own SystemObject so authorization has a valid object.
    const idSystemObject: number | undefined =
        asset.idSystemObject
        ?? (await DBAPI.SystemObject.fetchFromAssetVersionID(idAssetVersion))?.idSystemObject
        ?? undefined;

    if (!assetVersion.Ingested) {
        const stagingPath = await storage.stagingFileName(assetVersion.StorageKeyStaging);
        return { filePath: stagingPath, idSystemObject };
    }

    if (!asset.StorageKey)
        return { filePath: null, idSystemObject, error: 'Asset.StorageKey missing for ingested AssetVersion' };

    const dir = await storage.repositoryFileName(asset.StorageKey, assetVersion.Version);
    return { filePath: path.join(dir, assetVersion.FileName), idSystemObject };
}
