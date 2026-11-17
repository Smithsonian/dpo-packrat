/* eslint-disable @typescript-eslint/no-explicit-any */
import * as COL from '../../../collections/interface';
import { ASL, LocalStore } from '../../../utils/localStore';
import { isAuthenticated } from '../../auth';
import { Config } from '../../../config';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { Request, Response } from 'express';

/**
 * Read-only EDAN query probe for diagnostics.
 *   GET /api/system/edan-query?op=search&q=<text>&rows=&start=&type=&searchMetadata=&gatherRaw=&gatherIDMap=
 *   GET /api/system/edan-query?op=content&url=<edanmdm:/edanlists: locator>
 *   GET /api/system/edan-query?op=content&id=<EDAN internal id/UUID>
 *
 * Exposes the two collection primitives (queryCollection, fetchContent) so a curator or
 * engineer can resolve a subject, a record, or an edanlists aggregate and read the raw EDAN
 * response without pushing a change to production. The `content` op deliberately surfaces the
 * id-vs-url distinction: a scheme-prefixed locator (edanmdm:/edanlists:) resolves via `url=`,
 * an opaque internal id/UUID via `id=`. The echoed `_debug` block shows the exact outbound
 * endpoint and parameter actually sent, so a miss can be told apart from a wrong parameter.
 */

const SRC: string = 'HTTP.Route.EdanQuery';
const DEFAULT_ROWS: number = 10;
const MAX_ROWS: number = 100;
const CONTENT_PATH: string = 'content/v2.0/content/getContent.htm';
const SEARCH_PATH: string = 'metadata/v2.0/metadata/search.htm';

function respond(res: Response, success: boolean, message: string | undefined, data?: any): void {
    res.status(200).send(JSON.stringify({ success, message, data }));
}

function parseBool(value: unknown): boolean {
    return value === '1' || value === 'true';
}

function boundedInt(value: unknown, fallback: number, min: number, max: number): number {
    const n: number = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.min(max, Math.max(min, Math.floor(n)));
}

export async function edanQuery(req: Request, res: Response): Promise<void> {
    if (!isAuthenticated(req)) {
        respond(res, false, 'edanQuery: not authenticated');
        return;
    }
    const LS: LocalStore | undefined = ASL.getStore();
    if (!LS || !LS.idUser) {
        respond(res, false, 'edanQuery: missing local store/user');
        return;
    }
    const authorized: number[] = [...new Set([...Config.auth.users.admin, ...Config.auth.users.tools])];
    if (!authorized.includes(LS.idUser)) {
        respond(res, false, 'edanQuery: not authorized');
        return;
    }

    const op: string = (typeof req.query.op === 'string' ? req.query.op : 'search').toLowerCase();
    const server: string = Config.collection.edan.server;

    try {
        const ICol: COL.ICollection = COL.CollectionFactory.getInstance();

        if (op === 'content') {
            const id: string = typeof req.query.id === 'string' ? req.query.id : '';
            const url: string = typeof req.query.url === 'string' ? req.query.url : '';
            if (!id && !url) {
                respond(res, false, 'edanQuery: content op requires an id= or url= parameter');
                return;
            }

            // fetchContent prefers id when both are present; mirror that here so the echoed
            // _debug reflects the parameter EDAN actually received.
            const paramUsed: 'id' | 'url' = id ? 'id' : 'url';
            const params: string = id ? `id=${encodeURIComponent(id)}` : `url=${encodeURIComponent(url)}`;

            const record: COL.EdanRecord | null = await ICol.fetchContent(id || undefined, url || undefined);
            RK.logInfo(RK.LogSection.eHTTP, 'edan query content', undefined, { id, url, paramUsed, found: !!record, idUser: LS.idUser }, SRC);
            respond(res, true, record ? undefined : 'EDAN returned no record for the given locator', {
                op, request: { id: id || undefined, url: url || undefined },
                _debug: { server, path: CONTENT_PATH, params, paramUsed },
                record,
            });
            return;
        }

        if (op === 'search') {
            const query: string = typeof req.query.q === 'string' ? req.query.q : '';
            const rows: number = boundedInt(req.query.rows, DEFAULT_ROWS, 0, MAX_ROWS);
            const start: number = boundedInt(req.query.start, 0, 0, Number.MAX_SAFE_INTEGER);
            const options: COL.CollectionQueryOptions = {
                searchMetadata: parseBool(req.query.searchMetadata),
                recordType: typeof req.query.type === 'string' && req.query.type ? req.query.type : undefined,
                // Default raw ON for a diagnostic: the caller usually wants the full EDAN row.
                gatherRaw: req.query.gatherRaw === undefined ? true : parseBool(req.query.gatherRaw),
                gatherIDMap: parseBool(req.query.gatherIDMap),
            };

            const results: COL.CollectionQueryResults | null = await ICol.queryCollection(query, rows, start, options);
            RK.logInfo(RK.LogSection.eHTTP, 'edan query search', undefined,
                { query, rows, start, options, rowCount: results?.rowCount ?? 0, idUser: LS.idUser }, SRC);
            respond(res, true, results?.error ?? undefined, {
                op, request: { q: query, rows, start, options },
                _debug: { server, path: SEARCH_PATH, q: encodeURIComponent(query) },
                results,
            });
            return;
        }

        respond(res, false, `edanQuery: unknown op '${op}' (expected 'search' or 'content')`);
    } catch (error) {
        RK.logError(RK.LogSection.eHTTP, 'edanQuery failed', error instanceof Error ? error.message : String(error), { op }, SRC);
        respond(res, false, `edanQuery: ${error instanceof Error ? error.message : 'unexpected error'}`);
    }
}
