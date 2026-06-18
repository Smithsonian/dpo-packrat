/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /api/asset-version/:idAssetVersion/volume-inspection
 *
 * Returns the `VolumeExtractedMetadata` JSON produced by a completed
 * JobVolumeInspect run for the given asset version. Used by the volumetric
 * ingestion form to pre-fill fields the user then confirms.
 *
 * Response shape:
 *   { success, message?, data?: VolumeExtractedMetadata | null }
 *
 * `data` is null (with `success: true`) when no completed inspection exists
 * for the asset version — that's a valid state, not an error.
 */
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import { isAuthenticated } from '../../auth';
import { Request, Response } from 'express';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { Authorization, AUTH_ERROR } from '../../../auth/Authorization';
import { ASL, LocalStore } from '../../../utils/localStore';
import {
    JobVolumeInspectOutput,
    VolumeExtractedMetadata,
} from '../../../job/impl/Volume/JobVolumeInspectOutput';

type VolumeInspectionResponse = {
    success: boolean;
    message?: string;
    data?: VolumeExtractedMetadata | null;
};

const generateResponse = (success: boolean, message?: string, data?: VolumeExtractedMetadata | null): VolumeInspectionResponse => ({ success, message, data });

const isAuthorized = async (req: Request): Promise<H.IOResults> => {
    if (!isAuthenticated(req)) {
        RK.logError(RK.LogSection.eHTTP, 'is authorized failed', 'not authenticated', {}, 'HTTP.Route.VolumeInspection');
        return { success: false, error: 'not authenticated' };
    }
    const LS: LocalStore | undefined = ASL.getStore();
    if (!LS || !LS.idUser) {
        RK.logError(RK.LogSection.eHTTP, 'is authorized failed', 'no LocalStore or idUser', {}, 'HTTP.Route.VolumeInspection');
        return { success: false, error: 'missing local store/user' };
    }
    return { success: true };
};

export async function getVolumeInspection(req: Request, res: Response): Promise<void> {
    const authResult = await isAuthorized(req);
    if (!authResult.success) {
        res.status(200).send(JSON.stringify(generateResponse(false, `getVolumeInspection: ${authResult.error}`)));
        return;
    }

    const idAssetVersion: number = parseInt(req.params.idAssetVersion, 10);
    if (!Number.isFinite(idAssetVersion) || idAssetVersion <= 0) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'invalid idAssetVersion')));
        return;
    }

    // Authorize against the SystemObject that owns the AssetVersion's Asset.
    const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion);
    if (!assetVersion) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'AssetVersion not found')));
        return;
    }
    const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
    if (!asset) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'Asset not found')));
        return;
    }
    const ctx = Authorization.getContext();
    if (!ctx || !asset.idSystemObject || !await Authorization.canAccessSystemObject(ctx, asset.idSystemObject)) {
        res.status(200).send(JSON.stringify(generateResponse(false, AUTH_ERROR.ACCESS_DENIED)));
        return;
    }

    const output: JobVolumeInspectOutput | null = await JobVolumeInspectOutput.extractFromAssetVersion(idAssetVersion);
    if (!output) {
        // No completed inspection — valid state for an AssetVersion that has not
        // been inspected yet (e.g. non-volumetric uploads, or an upload that
        // failed inspection).
        res.status(200).send(JSON.stringify(generateResponse(true, 'no inspection result', null)));
        return;
    }

    if (!output.success || !output.metadata) {
        res.status(200).send(JSON.stringify(generateResponse(false, output.error || 'inspection result unavailable')));
        return;
    }

    res.status(200).send(JSON.stringify(generateResponse(true, 'inspection result', output.metadata)));
}
