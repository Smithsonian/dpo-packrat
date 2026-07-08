import * as DBAPI from '../../../db';
import { ASL, LocalStore } from '../../../utils/localStore';
import { isAuthenticated } from '../../auth';
import { Authorization, AUTH_ERROR } from '../../../auth/Authorization';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { retireSystemObjectTree } from '../../../objectAction/RetireExecutorDeps';
import { describeSummaries, resultSummaries, blockerSummaries } from '../../../objectAction/ObjectSummary';
import { RetireExecutionResult } from '../../../objectAction/RetireExecutor';
import { Request, Response } from 'express';

type ObjectActionName = 'describe' | 'retire' | 'reinstate';
const ACTIONS: ObjectActionName[] = ['describe', 'retire', 'reinstate'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function respond(res: Response, success: boolean, message: string | undefined, data?: any): void {
    res.status(200).send(JSON.stringify({ success, message, data }));
}

/**
 * POST /api/object/action — generic "act on an object" endpoint.
 * Body: { idSystemObject, action: 'describe'|'retire'|'reinstate', options? }.
 *   describe            — read-only preview of the objects a retire/reinstate would touch.
 *   retire | reinstate  — apply the action to the object and its resolved dependents/assets.
 */
export async function objectAction(req: Request, res: Response): Promise<void> {
    if (!isAuthenticated(req)) {
        respond(res, false, 'objectAction: not authenticated');
        return;
    }
    const LS: LocalStore | undefined = ASL.getStore();
    if (!LS || !LS.idUser) {
        respond(res, false, 'objectAction: missing local store/user');
        return;
    }

    const { idSystemObject, action } = req.body ?? {};
    const idSO: number = Number(idSystemObject);
    if (!Number.isInteger(idSO) || idSO <= 0) {
        respond(res, false, 'objectAction: valid idSystemObject required');
        return;
    }
    if (!ACTIONS.includes(action)) {
        respond(res, false, `objectAction: action must be one of ${ACTIONS.join(', ')}`);
        return;
    }

    // Authorization: fail-closed on access to the target SystemObject.
    const ctx = Authorization.getContext();
    if (!ctx || !await Authorization.canAccessSystemObject(ctx, idSO)) {
        respond(res, false, AUTH_ERROR.ACCESS_DENIED);
        return;
    }

    try {
        if (action === 'describe') {
            const resolution: DBAPI.RetireResolution | null = await DBAPI.resolveRetireCandidatesFromSystemObject(idSO);
            if (!resolution) {
                respond(res, false, `objectAction: unable to resolve objects for ${idSO}`);
                return;
            }
            respond(res, true, undefined, {
                action,
                idSystemObject: idSO,
                objects: await describeSummaries(resolution.candidates),
                blockers: await blockerSummaries(resolution.blockers),
            });
            return;
        }

        const retire: boolean = action === 'retire';
        const result: RetireExecutionResult = await retireSystemObjectTree(idSO, retire);
        respond(res, result.applied, result.message, {
            action,
            idSystemObject: idSO,
            applied: result.applied,
            edanFailures: result.edanFailures,
            objects: await resultSummaries(result.items),
            blockers: await blockerSummaries(result.blockers),
        });
    } catch (error) {
        RK.logError(RK.LogSection.eHTTP, 'objectAction failed',
            error instanceof Error ? error.message : String(error), { idSystemObject: idSO, action }, 'HTTP.Route.ObjectAction');
        respond(res, false, `objectAction: ${error instanceof Error ? error.message : 'unexpected error'}`);
    }
}
