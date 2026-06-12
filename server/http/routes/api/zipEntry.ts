/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /api/zip-entry/:idAssetVersion?path=<entry>
 *
 * Streams a single entry from a ZIP asset version. Used by the client-side
 * ZIP contents viewer for scan-sheet / scan-log preview, and by the
 * volumetric ingestion form for the same.
 *
 * Path-traversal protected: the requested entry must exist in the ZIP's
 * central directory, must not contain `..` or backslash, and must not start
 * with `/`. Any failure of these checks → 400 with a generic message
 * (no internal-path disclosure).
 */
import * as H from '../../../utils/helpers';
import * as path from 'path';
import * as mime from 'mime-types';
import { isAuthenticated } from '../../auth';
import { Request, Response } from 'express';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { ZipFile } from '../../../utils/zipFile';
import { Authorization, AUTH_ERROR } from '../../../auth/Authorization';
import { ASL, LocalStore } from '../../../utils/localStore';
import { resolveAssetVersionLocalPath } from './zipContents';

const isAuthorized = async (req: Request): Promise<H.IOResults> => {
    if (!isAuthenticated(req)) {
        RK.logError(RK.LogSection.eHTTP, 'is authorized failed', 'not authenticated', {}, 'HTTP.Route.ZipEntry');
        return { success: false, error: 'not authenticated' };
    }
    const LS: LocalStore | undefined = ASL.getStore();
    if (!LS || !LS.idUser) {
        RK.logError(RK.LogSection.eHTTP, 'is authorized failed', 'no LocalStore or idUser', {}, 'HTTP.Route.ZipEntry');
        return { success: false, error: 'missing local store/user' };
    }
    return { success: true };
};

function isPathTraversal(entryPath: string): boolean {
    if (!entryPath) return true;
    if (entryPath.startsWith('/')) return true;
    if (entryPath.includes('\\')) return true;
    // Reject any segment that's `..` or any occurrence of `..` slop.
    if (entryPath.includes('..')) return true;
    return false;
}

export async function getZipEntry(req: Request, res: Response): Promise<void> {
    const authResult = await isAuthorized(req);
    if (!authResult.success) {
        res.status(401).send('not authenticated');
        return;
    }

    const idAssetVersion: number = parseInt(req.params.idAssetVersion, 10);
    if (!Number.isFinite(idAssetVersion) || idAssetVersion <= 0) {
        res.status(400).send('invalid idAssetVersion');
        return;
    }

    const entryPath: string | undefined = typeof req.query.path === 'string' ? req.query.path : undefined;
    if (!entryPath) {
        res.status(400).send('missing path query parameter');
        return;
    }

    if (isPathTraversal(entryPath)) {
        RK.logWarning(RK.LogSection.eHTTP, 'zip entry rejected', 'path traversal blocked',
            { idAssetVersion, entryPath }, 'HTTP.Route.ZipEntry');
        res.status(400).send('invalid path');
        return;
    }

    const resolved = await resolveAssetVersionLocalPath(idAssetVersion);
    if (!resolved.filePath) {
        res.status(404).send('asset version not found');
        return;
    }

    const ctx = Authorization.getContext();
    if (ctx && resolved.idSystemObject && !await Authorization.canAccessSystemObject(ctx, resolved.idSystemObject)) {
        res.status(403).send(AUTH_ERROR.ACCESS_DENIED);
        return;
    }

    if (path.extname(resolved.filePath).toLowerCase() !== '.zip') {
        res.status(400).send('asset is not a ZIP archive');
        return;
    }

    const zip = new ZipFile(resolved.filePath);
    const load = await zip.load();
    if (!load.success) {
        res.status(400).send('failed to open ZIP');
        return;
    }

    try {
        // Verify entryPath actually exists in the central directory. This is the
        // second layer of path-traversal defense — the regex check above catches
        // syntactic abuse; this catches "any string that doesn't match a real
        // entry name."
        const allEntries: string[] = await zip.getAllEntries(null);
        if (!allEntries.includes(entryPath)) {
            res.status(400).send('invalid path');
            return;
        }

        const stream: NodeJS.ReadableStream | null = await zip.streamContent(entryPath);
        if (!stream) {
            res.status(500).send('failed to open entry');
            return;
        }

        // download=1 → attachment disposition forces a save dialog instead of
        // inline rendering. The query value is treated as truthy for any non-
        // empty string ('1', 'true', etc.) — undefined / absent → inline.
        const download: boolean = typeof req.query.download === 'string' && req.query.download.length > 0;
        const contentType: string = mime.lookup(entryPath) || 'application/octet-stream';
        const disposition: string = download ? 'attachment' : 'inline';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `${disposition}; filename="${path.basename(entryPath)}"`);

        await new Promise<void>((resolve, reject) => {
            stream.pipe(res);
            stream.on('end', () => resolve());
            stream.on('error', (err) => reject(err));
        });
    } catch (err) {
        RK.logError(RK.LogSection.eHTTP, 'zip entry failed', H.Helpers.getErrorString(err),
            { idAssetVersion, entryPath, filePath: resolved.filePath }, 'HTTP.Route.ZipEntry');
        if (!res.headersSent)
            res.status(500).send('unexpected error');
    } finally {
        await zip.close();
    }
}
