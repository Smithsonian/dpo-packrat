import { Request, Response } from 'express';
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COMMON from '@dpo-packrat/common';
import { TokenStore } from './TokenStore';
import { eObjectGraphMode, ObjectGraph } from '../../db/api/composite/ObjectGraph';
import { LicenseResolver } from '../../db/api/composite/LicenseResolver';
import { renderPreviewPage } from './preview/template';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import { eEventKey } from '../../event/interface/EventEnums';
import { RecordKeeper as RK } from '../../records/recordKeeper';
import { Config } from '../../config';

export async function preview(req: Request, res: Response): Promise<void> {
    const edanUUID: string = req.params.edanUUID;
    const clientId: string = (req.query.clientId as string) ?? '';
    const userId: string = (req.query.userId as string) ?? '';
    const referer: string | undefined = req.headers.referer;

    // 1. Validate params — edanUUID is required
    if (!edanUUID) {
        res.status(400).send(renderPreviewPage({
            state: 'error',
            message: 'Missing or invalid parameters.'
        }));
        return;
    }

    // 2. Resolve EDAN UUID → Scene → SystemObject
    const scenes: DBAPI.Scene[] | null = await DBAPI.Scene.fetchByUUID(edanUUID);
    if (!scenes || scenes.length === 0) {
        logAudit(0, clientId, userId, referer, 'blocked', 'scene not found for UUID');
        res.status(404).send(renderPreviewPage({
            state: 'not-found',
            message: 'Scene not found. A scene may not have been generated yet for this model.'
        }));
        return;
    }

    const sceneFromUUID: DBAPI.Scene = scenes[0];
    const systemObject: DBAPI.SystemObject | null =
        await DBAPI.SystemObject.fetchFromSceneID(sceneFromUUID.idScene);
    if (!systemObject) {
        logAudit(0, clientId, userId, referer, 'blocked', 'system object not found for scene');
        res.status(404).send(renderPreviewPage({
            state: 'not-found',
            message: 'Scene not found. A scene may not have been generated yet for this model.'
        }));
        return;
    }

    const idSystemObject: number = systemObject.idSystemObject;

    // 3. Validate clientId (optional — used for logging; will restrict access in the future)
    if (clientId) {
        const source: DBAPI.ExternalSource | null =
            await DBAPI.ExternalSource.fetchByClientId(clientId);
        if (!source || !source.isActive) {
            logAudit(idSystemObject, clientId, userId, referer, 'blocked', 'invalid clientId');
            res.status(403).send(renderPreviewPage({
                state: 'error',
                message: 'Unauthorized source.'
            }));
            return;
        }
    }

    // 4. Check Retired
    if (systemObject.Retired) {
        logAudit(idSystemObject, clientId, userId, referer, 'blocked', 'retired');
        res.status(200).send(renderPreviewPage({
            state: 'retired',
            message: 'This scene is retired and no longer active. Contact packrat@si.edu for assistance.'
        }));
        return;
    }

    // 5. Use the Scene already resolved from UUID lookup
    const scene: DBAPI.Scene = sceneFromUUID;

    // 6. Fetch ancestors via ObjectGraph (Subjects, Unit, Project)
    const OG: ObjectGraph =
        new ObjectGraph(idSystemObject, eObjectGraphMode.eAncestors, 32);
    if (!await OG.fetch()) {
        RK.logError(RK.LogSection.eHTTP, 'preview failed',
            'unable to fetch object graph', { idSystemObject }, 'HTTP.Route.Preview');
    }

    const subjects: DBAPI.Subject[] = OG.subject ?? [];
    const subjectNames: string[] = subjects.map(s => s.Name);

    const units: DBAPI.Unit[] = OG.unit ?? [];
    const unitName: string = units.length > 0 ? units[0].Name : 'Unknown';

    const projects: DBAPI.Project[] = OG.project ?? [];
    const projectRestricted: boolean = projects.some(p => p.isRestricted);

    // 7. Check Project.isRestricted
    if (projectRestricted) {
        logAudit(idSystemObject, clientId, userId, referer, 'blocked', 'project restricted');
        res.status(200).send(renderPreviewPage({
            state: 'blocked',
            message: 'This scene cannot be previewed and can only be accessed inside Packrat.'
        }));
        return;
    }

    // 8. Check Subject Sensitivity
    const sensitivity = await getSubjectSensitivity(idSystemObject);
    if (sensitivity.level >= 2) {
        logAudit(idSystemObject, clientId, userId, referer, 'blocked',
            `sensitivity level ${sensitivity.level}`);
        res.status(200).send(renderPreviewPage({
            state: 'blocked',
            message: 'This scene cannot be previewed and can only be accessed inside Packrat.'
        }));
        return;
    }

    // 9. Check License
    const LR: LicenseResolver | null =
        await CACHE.LicenseCache.getLicenseResolver(idSystemObject)
        ?? await LicenseResolver.fetch(idSystemObject) ?? null;
    const licenseName: string = LR?.License?.Name ?? 'No License';
    const licenseRestrict: number = LR?.License?.RestrictLevel ?? 0;
    const licenseInherited: boolean = LR?.inherited ?? false;

    if (licenseRestrict >= 1000) {
        logAudit(idSystemObject, clientId, userId, referer, 'blocked',
            `license restrict level ${licenseRestrict}`);
        res.status(200).send(renderPreviewPage({
            state: 'blocked',
            message: 'This scene cannot be previewed and can only be accessed inside Packrat.'
        }));
        return;
    }

    // 10. Fetch published state — use labels matching the scene details status table
    const SOV: DBAPI.SystemObjectVersion | null =
        await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(idSystemObject);
    const publishedState: number = SOV?.PublishedState ?? 0;
    const publishedLabelMap: Record<number, string> = {
        [COMMON.ePublishedState.eNotPublished]: 'Unpublished',
        [COMMON.ePublishedState.eAPIOnly]: 'Unlisted (API Only)',
        [COMMON.ePublishedState.ePublished]: 'Public',
        [COMMON.ePublishedState.eInternal]: 'Internal',
    };
    let publishedLabel: string = publishedLabelMap[publishedState] ?? 'Unpublished';

    // Append published date for any non-Unpublished state
    if (SOV && publishedState !== COMMON.ePublishedState.eNotPublished) {
        const d: Date = new Date(SOV.DateCreated);
        const iso: string = d.toISOString().slice(0, 10); // YYYY-MM-DD
        publishedLabel += ` — Published on ${iso}`;
    }

    // 11. Get Voyager params (SVX document + path)
    const voyagerParams = await getVoyagerParamsForPreview(idSystemObject);

    // 12. Generate preview token
    const token: string =
        TokenStore.generate('preview', { idSystemObject, clientId, userId });

    // 13. Build Voyager root URL
    // In production, nginx routes /server/* to Express — download URLs need this prefix.
    // Locally (no nginx), serverUrl has no path prefix so this resolves to empty string.
    const serverPrefix: string = new URL(Config.http.serverUrl).pathname.replace(/\/$/, '');
    const pathSegment: string = voyagerParams.path ? `/${voyagerParams.path}` : '';
    const rootUrl: string =
        `${serverPrefix}/download/preview-${token}/idSystemObject-${idSystemObject}${pathSegment}/`;

    // 14. Audit: allowed
    logAudit(idSystemObject, clientId, userId, referer, 'allowed', null);

    // 15. Format license display
    const licenseType: string = licenseName.split(',')[0];
    const allowsDownloads: boolean = licenseName.includes('Download');
    const licenseDisplay: string =
        licenseType + (allowsDownloads ? ' (Downloads)' : '')
        + (licenseInherited ? ' (inherited)' : '');

    // 16. Build Packrat base URL for "Open in Packrat" link
    const packratBaseUrl: string = Config.http.clientUrl.replace(/\/$/, '');

    // 17. Render
    res.status(200).send(renderPreviewPage({
        state: 'preview',
        idSystemObject,
        sceneName: scene.Name,
        subjectNames,
        unitName,
        licenseDisplay,
        qcd: scene.PosedAndQCd,
        publishedLabel,
        voyagerRootUrl: rootUrl,
        voyagerDocument: voyagerParams.document,
        sensitivityWarning: sensitivity.level === 1,
        packratBaseUrl
    }));
}

async function getSubjectSensitivity(idSystemObject: number): Promise<{ level: number; label: string }> {
    const properties: DBAPI.ObjectProperty[] | null =
        await DBAPI.ObjectProperty.fetchDerivedFromObject([idSystemObject]);
    if (!properties || properties.length <= 0)
        return { level: 0, label: 'Unassigned' };

    const prop = properties[0];
    if (prop.PropertyType !== 'sensitivity')
        return { level: 0, label: 'Unassigned' };

    const labels: Record<number, string> = {
        0: 'Not Sensitive',
        1: 'Sensitive',
        2: 'Restricted',
    };
    return { level: prop.Level, label: labels[prop.Level] ?? 'Confidential' };
}

async function getVoyagerParamsForPreview(idSystemObject: number): Promise<{ path: string; document: string }> {
    const assetVersions: DBAPI.AssetVersion[] | null =
        await DBAPI.AssetVersion.fetchLatestFromSystemObject(idSystemObject);
    if (!assetVersions || assetVersions.length === 0)
        return { path: '', document: '' };

    const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
    if (!SO)
        return { path: '', document: '' };

    // Find the preferred asset (svx.json) for the scene
    for (const assetVersion of assetVersions) {
        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
        if (!asset)
            continue;

        if (await CACHE.VocabularyCache.isPreferredAsset(asset.idVAssetType, SO))
            return { path: assetVersion.FilePath, document: assetVersion.FileName };
    }

    // Fallback to first asset version
    return { path: assetVersions[0].FilePath, document: assetVersions[0].FileName };
}

function logAudit(
    idSystemObject: number, clientId: string, userId: string,
    referer: string | undefined, result: string, reason: string | null
): void {
    AuditFactory.audit(
        { url: `/preview/${idSystemObject || 'unknown'}`, preview: true,
            clientId, userId, referer, result, reason },
        { eObjectType: COMMON.eSystemObjectType.eScene,
            idObject: idSystemObject },
        eEventKey.eHTTPDownload
    );
}
