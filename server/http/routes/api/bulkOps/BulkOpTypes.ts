/* eslint-disable @typescript-eslint/no-explicit-any */
import { RecordKeeper as RK } from '../../../../records/recordKeeper';
import * as H from '../../../../utils/helpers';

export interface BulkOpColumn { key: string; label: string; }
export interface BulkOpSetting { key: string; label: string; type: 'select'; options: { value: string; label: string }[]; }
/** A pre-run parameter the user chooses before gathering (e.g. the Sync-from-EDAN target: Subject vs Scene). */
export interface BulkOpParam { key: string; label: string; type: 'select'; options: { value: string; label: string }[]; default?: string; }

export interface BulkOpRow {
    id: number;                 // idSystemObject
    name: string;
    isCandidate: boolean;       // selectable-by-default: a change is available/needed for this row
    rowData?: any;              // values for the op-declared columns
    defaultSettings?: any;      // initial per-row settings
    current?: any;              // current per-setting value (the "before")
}

export type BulkOpReporter = (processed: number, total: number) => void;
export interface BulkOpApplyResult { success: boolean; message?: string; rowData?: any; }
export interface BulkOpGatherArgs { params: any; scopedIds?: number[]; }

/**
 * A bulk operation is fully self-contained: it declares its own columns / per-row settings / optional
 * pre-run params, gathers its own candidate rows (it may enumerate however it likes and call external
 * services, reporting progress), and applies a change to ONE object. The harness route and client are
 * generic across every op, so a new op — however different its list-building or apply logic — is just a
 * new registry entry and never constrained by what the other ops do.
 */
export interface BulkOperationDef {
    key: string;
    label: string;
    columns: BulkOpColumn[];
    rowSettings: BulkOpSetting[];
    params?: BulkOpParam[];
    gather: (args: BulkOpGatherArgs, report: BulkOpReporter) => Promise<BulkOpRow[]>;
    apply: (idSystemObject: number, rowSettings: any, idUser: number, params: any) => Promise<BulkOpApplyResult>;
}

export type BulkOpPhase = 'idle' | 'running' | 'completed' | 'error';
export interface BulkOpJobProgress {
    phase: BulkOpPhase;
    operation: string | null;
    processed: number;
    total: number;
    startTime: string | null;
    endTime: string | null;
    error: string | null;
}

const SRC = 'HTTP.Route.BulkOp.Job';

/**
 * Single in-flight gather job for the whole harness (one at a time), modeled on the Solr reindex job:
 * a fire-and-forget async run with an in-memory progress singleton the client polls, plus the row set
 * the run produced. The gather phase can be long (e.g. an external EDAN sweep of every Subject), so it
 * must not run inside the request; `apply` stays a per-item synchronous call the client loops.
 */
export class BulkOpJob {
    private static _progress: BulkOpJobProgress = BulkOpJob.idle();
    private static _rows: BulkOpRow[] = [];
    private static _running: boolean = false;

    private static idle(): BulkOpJobProgress {
        return { phase: 'idle', operation: null, processed: 0, total: 0, startTime: null, endTime: null, error: null };
    }

    static get progress(): BulkOpJobProgress { return { ...BulkOpJob._progress }; }
    static get rows(): BulkOpRow[] { return [...BulkOpJob._rows]; }
    static get isRunning(): boolean { return BulkOpJob._running; }

    /** Start a gather. Returns false when one is already running. Fire-and-forget: the route does not
     * await this; the client polls `progress` and then reads `rows`. */
    static async run(op: BulkOperationDef, args: BulkOpGatherArgs): Promise<boolean> {
        if (BulkOpJob._running)
            return false;
        BulkOpJob._running = true;
        BulkOpJob._rows = [];
        BulkOpJob._progress = { phase: 'running', operation: op.key, processed: 0, total: 0,
            startTime: new Date().toISOString(), endTime: null, error: null };
        try {
            BulkOpJob._rows = await op.gather(args, (processed: number, total: number) => {
                BulkOpJob._progress.processed = processed;
                BulkOpJob._progress.total = total;
            });
            BulkOpJob._progress.phase = 'completed';
        } catch (error) {
            const message: string = H.Helpers.getErrorString(error);
            BulkOpJob._progress.phase = 'error';
            BulkOpJob._progress.error = message;
            RK.logError(RK.LogSection.eHTTP, 'bulk op gather failed', message, { operation: op.key }, SRC);
        } finally {
            BulkOpJob._progress.endTime = new Date().toISOString();
            BulkOpJob._running = false;
        }
        return true;
    }
}
