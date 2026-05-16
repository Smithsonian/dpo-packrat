/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import * as DBAPI from '../../../db';
import { ASL, LocalStore } from '../../../utils/localStore';
import { isAuthenticated } from '../../auth';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

type LifelineResponse = {
    success: boolean;
    message?: string;
    data?: {
        idSystemObject: number;
        offset: number;
        limit: number;
        total: number;
        rows: DBAPI.AuditLifelineRow[];
    };
};

/**
 * GET /api/audit/lifeline/:idSystemObject
 *
 * Returns the full audit history for one SystemObject, ordered by AuditDate
 * (newest-first by default). Includes actor (idUser + name, or SystemActor),
 * the resolved AuditType enum name, the JSON-string Data payload, and the
 * correlation id so a consumer can follow links such as
 * `Data.parentRetirement.idAudit` back to the cascade root.
 *
 * Query params (all optional):
 *   offset      number  rows to skip; default 0
 *   limit       number  max rows; default 50; clamped to [1, 500]
 *   order       'asc' | 'desc' (default 'desc')
 *
 * Auth: any authenticated user (parity with detail page visibility).
 * Returns 401 when not authenticated.
 */
export async function getAuditLifeline(req: Request, res: Response): Promise<void> {
    try {
        if (!isAuthenticated(req)) {
            res.status(401).send(JSON.stringify({ success: false, message: 'not authenticated' } as LifelineResponse));
            return;
        }
        const LS: LocalStore | undefined = ASL.getStore();
        if (!LS || !LS.idUser) {
            res.status(401).send(JSON.stringify({ success: false, message: 'missing local store/user' } as LifelineResponse));
            return;
        }

        const idSystemObject: number = parseInt(req.params.id, 10);
        if (!Number.isFinite(idSystemObject) || idSystemObject <= 0) {
            res.status(400).send(JSON.stringify({ success: false, message: `invalid idSystemObject: ${req.params.id}` } as LifelineResponse));
            return;
        }

        const offsetRaw = parseInt(String(req.query.offset ?? '0'), 10);
        const limitRaw = parseInt(String(req.query.limit ?? '50'), 10);
        const offset: number = Number.isFinite(offsetRaw) && offsetRaw > 0 ? offsetRaw : 0;
        const limit: number = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(500, limitRaw) : 50;
        const descending: boolean = String(req.query.order ?? 'desc').toLowerCase() !== 'asc';

        const result = await DBAPI.Audit.fetchByIdSystemObject(idSystemObject, { offset, limit, descending });

        const response: LifelineResponse = {
            success: true,
            data: {
                idSystemObject,
                offset,
                limit,
                total: result.total,
                rows: result.rows,
            },
        };
        res.status(200).send(JSON.stringify(response));
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        RK.logError(RK.LogSection.eHTTP, 'audit lifeline failed', message,
            { idSystemObject: req.params.id, query: req.query }, 'HTTP.Route.AuditLifeline');
        res.status(500).send(JSON.stringify({ success: false, message } as LifelineResponse));
    }
}
