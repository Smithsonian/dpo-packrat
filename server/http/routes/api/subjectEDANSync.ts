import { Request, Response } from 'express';
import { isAuthenticated } from '../../auth';
import { ASL, LocalStore } from '../../../utils/localStore';
import { Config } from '../../../config';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { SubjectEDANSync } from '../../../utils/subjectEDANSync';

const SRC = 'HTTP.Route.SubjectEDANSync';

async function requireAdmin(req: Request, res: Response, label: string): Promise<boolean> {
    if (!isAuthenticated(req)) {
        res.status(200).send(JSON.stringify({ success: false, message: `${label}: not authenticated` }));
        return false;
    }
    const LS: LocalStore | undefined = ASL.getStore();
    if (!LS || !LS.idUser || !Config.auth.users.admin.includes(LS.idUser)) {
        RK.logError(RK.LogSection.eHTTP, 'subject EDAN sync auth failed', 'not authorized (admin only)', {}, SRC);
        res.status(200).send(JSON.stringify({ success: false, message: `${label}: not authorized (admin only)` }));
        return false;
    }
    return true;
}

// POST /api/edan/subject-sync — start a read-only reconciliation sweep. Fire-and-forget: the sweep
// runs in the background and the client polls status. Reports failure if one is already in progress.
export async function subjectEDANSyncStart(req: Request, res: Response): Promise<void> {
    if (!await requireAdmin(req, res, 'subjectEDANSyncStart'))
        return;
    if (SubjectEDANSync.isRunning) {
        res.status(200).send(JSON.stringify({ success: false, message: 'A Subject EDAN sync is already in progress' }));
        return;
    }
    void SubjectEDANSync.run().catch(error =>
        RK.logError(RK.LogSection.eHTTP, 'subject EDAN sync start failed', error instanceof Error ? error.message : String(error), {}, SRC));
    RK.logInfo(RK.LogSection.eHTTP, 'subject EDAN sync started', undefined, {}, SRC);
    res.status(200).send(JSON.stringify({ success: true, message: 'Subject EDAN sync started' }));
}

// GET /api/edan/subject-sync/status — poll progress (phase / processed / total / summary counts).
export async function subjectEDANSyncStatus(req: Request, res: Response): Promise<void> {
    if (!await requireAdmin(req, res, 'subjectEDANSyncStatus'))
        return;
    res.status(200).send(JSON.stringify({ success: true, data: SubjectEDANSync.progress }));
}

// GET /api/edan/subject-sync/results — the full per-Subject outcome list from the last/current sweep.
export async function subjectEDANSyncResults(req: Request, res: Response): Promise<void> {
    if (!await requireAdmin(req, res, 'subjectEDANSyncResults'))
        return;
    res.status(200).send(JSON.stringify({ success: true, data: SubjectEDANSync.results }));
}
