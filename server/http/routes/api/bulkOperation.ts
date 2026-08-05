/* eslint-disable @typescript-eslint/no-explicit-any */
import { ASL, LocalStore } from '../../../utils/localStore';
import { isAuthenticated } from '../../auth';
import { Authorization, AUTH_ERROR } from '../../../auth/Authorization';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { Request, Response } from 'express';
import { BulkOperationDef, BulkOpJob } from './bulkOps/BulkOpTypes';
import { OPERATIONS, OPERATION_LIST } from './bulkOps/registry';

function respond(res: Response, success: boolean, message: string | undefined, data?: any): void {
    res.status(200).send(JSON.stringify({ success, message, data }));
}

/**
 * POST /api/bulk/operation — run a registered bulk operation over objects.
 * Body: { operation, mode, params?, idSystemObjects?, idSystemObject?, rowSettings? }.
 *   describe — the op's columns + per-row settings + pre-run params.
 *   list     — the registered operations (key + label).
 *   start    — kick off the async gather job (fire-and-forget); the gather may be long (e.g. an EDAN
 *              sweep), so it runs in the background and the client polls. One job at a time.
 *   status   — the gather job progress (phase / processed / total).
 *   results  — the rows the completed gather produced (op columns + defaults per row).
 *   apply    — mutate ONE object with its (possibly edited) settings; the client loops these.
 * Admin-gated; apply is additionally per-object authorized.
 */
export async function bulkOperation(req: Request, res: Response): Promise<void> {
    if (!isAuthenticated(req)) {
        respond(res, false, 'bulkOperation: not authenticated');
        return;
    }
    const LS: LocalStore | undefined = ASL.getStore();
    if (!LS || !LS.idUser) {
        respond(res, false, 'bulkOperation: missing local store/user');
        return;
    }
    const idUser: number = LS.idUser;

    const ctx = Authorization.getContext();
    if (!ctx || !ctx.isAdmin) {
        respond(res, false, AUTH_ERROR.ACCESS_DENIED);
        return;
    }

    const { operation, mode, params, idSystemObject, idSystemObjects, rowSettings } = req.body ?? {};

    // The op catalog needs no specific operation.
    if (mode === 'list') {
        respond(res, true, undefined, { operations: OPERATION_LIST });
        return;
    }

    const op: BulkOperationDef | undefined = typeof operation === 'string' ? OPERATIONS[operation] : undefined;
    if (!op) {
        respond(res, false, `bulkOperation: unknown operation '${operation}'. Known: ${Object.keys(OPERATIONS).join(', ')}`);
        return;
    }

    try {
        if (mode === 'describe') {
            respond(res, true, undefined, { key: op.key, label: op.label, columns: op.columns, rowSettings: op.rowSettings, params: op.params ?? [] });
            return;
        }

        if (mode === 'start') {
            if (BulkOpJob.isRunning) {
                respond(res, false, 'bulkOperation: a bulk operation is already running');
                return;
            }
            const scopedIds: number[] | undefined = Array.isArray(idSystemObjects) && idSystemObjects.length > 0
                ? idSystemObjects.map((n: any) => Number(n)).filter((n: number) => Number.isInteger(n) && n > 0)
                : undefined;
            void BulkOpJob.run(op, { params: params ?? {}, scopedIds }).catch(error =>
                RK.logError(RK.LogSection.eHTTP, 'bulkOperation start failed',
                    error instanceof Error ? error.message : String(error), { operation: op.key }, 'HTTP.Route.BulkOperation'));
            respond(res, true, 'Bulk operation started');
            return;
        }

        if (mode === 'status') {
            respond(res, true, undefined, { progress: BulkOpJob.progress });
            return;
        }

        if (mode === 'results') {
            respond(res, true, undefined, { operation: BulkOpJob.progress.operation, columns: op.columns, rowSettings: op.rowSettings, rows: BulkOpJob.rows });
            return;
        }

        if (mode === 'apply') {
            const idSO: number = Number(idSystemObject);
            if (!Number.isInteger(idSO) || idSO <= 0) {
                respond(res, false, 'bulkOperation: apply requires a valid idSystemObject');
                return;
            }
            if (!await Authorization.canAccessSystemObject(ctx, idSO)) {
                respond(res, false, AUTH_ERROR.ACCESS_DENIED);
                return;
            }
            const result = await op.apply(idSO, rowSettings ?? {}, idUser, params ?? {});
            respond(res, result.success, result.message, { id: idSO, ...result });
            return;
        }

        respond(res, false, 'bulkOperation: mode must be list, describe, start, status, results, or apply');
    } catch (error) {
        RK.logError(RK.LogSection.eHTTP, 'bulkOperation failed',
            error instanceof Error ? error.message : String(error), { operation, mode }, 'HTTP.Route.BulkOperation');
        respond(res, false, `bulkOperation: ${error instanceof Error ? error.message : 'unexpected error'}`);
    }
}
