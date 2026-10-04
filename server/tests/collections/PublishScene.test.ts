/* eslint-disable @typescript-eslint/no-explicit-any */
import { PublishScene } from '../../collections/impl/PublishScene';
import * as COMMON from '@dpo-packrat/common';
import { expectLogErrors } from '../logGate';

// Hermetic coverage for the publish decision logic (TR-13): the EDAN search-flag
// matrix per ePublishedState (with license-gated downloads) and the
// SystemObjectVersion published-state write. Both are exercised on a PublishScene
// instance directly (no DB, no EDAN, no storage).

describe('PublishScene.computeEdanSearchFlags — EDAN flag matrix', () => {
    let ps: PublishScene;
    beforeEach(() => { ps = new PublishScene(0); });

    // RestrictLevel <= 20 permits downloads; > 20 blocks them; undefined (no LR) blocks them.
    function flags(eState: COMMON.ePublishedState, restrictLevel?: number): any {
        const LR = restrictLevel === undefined ? undefined : { License: { RestrictLevel: restrictLevel } } as any;
        const edanRecord = { status: 0, publicSearch: false } as any;
        return (ps as any).computeEdanSearchFlags(edanRecord, eState, LR);
    }

    test('Published: on-site and searchable; downloads only when the license permits', () => {
        expect(flags(COMMON.ePublishedState.ePublished)).toMatchObject({ status: 0, publicSearch: true, downloads: false });      // no license
        expect(flags(COMMON.ePublishedState.ePublished, 10)).toMatchObject({ status: 0, publicSearch: true, downloads: true });   // permissive
        expect(flags(COMMON.ePublishedState.ePublished, 30)).toMatchObject({ status: 0, publicSearch: true, downloads: false });  // restrictive
    });

    test('API-only: not searchable; downloads gated by license', () => {
        expect(flags(COMMON.ePublishedState.eAPIOnly, 10)).toMatchObject({ status: 0, publicSearch: false, downloads: true });
        expect(flags(COMMON.ePublishedState.eAPIOnly, 30)).toMatchObject({ status: 0, publicSearch: false, downloads: false });
    });

    test('Not published: status 1, hidden, no downloads regardless of license', () => {
        expect(flags(COMMON.ePublishedState.eNotPublished, 10)).toMatchObject({ status: 1, publicSearch: false, downloads: false });
    });

    test('Internal: status 1, hidden; downloads gated by license', () => {
        expect(flags(COMMON.ePublishedState.eInternal, 10)).toMatchObject({ status: 1, publicSearch: false, downloads: true });
        expect(flags(COMMON.ePublishedState.eInternal, 30)).toMatchObject({ status: 1, publicSearch: false, downloads: false });
    });
});

describe('PublishScene.updatePublishedState — SystemObjectVersion write', () => {
    let ps: PublishScene;

    function fakeSOV(initial: COMMON.ePublishedState, updateResult: boolean = true): any {
        return {
            _state: initial,
            publishedStateEnum(): COMMON.ePublishedState { return this._state; },
            setPublishedState(s: COMMON.ePublishedState): void { this._state = s; },
            update: jest.fn(async () => updateResult),
        };
    }

    beforeEach(() => { ps = new PublishScene(0); });

    test('returns false when there is no SystemObjectVersion', async () => {
        (ps as any).systemObjectVersion = null;
        expect(await (ps as any).updatePublishedState(undefined, COMMON.ePublishedState.ePublished)).toBe(false);
    });

    test('writes the intended state when it differs from the current state', async () => {
        const sov = fakeSOV(COMMON.ePublishedState.eNotPublished);
        (ps as any).systemObjectVersion = sov;
        const ok = await (ps as any).updatePublishedState(undefined, COMMON.ePublishedState.ePublished);
        expect(ok).toBe(true);
        expect(sov.update).toHaveBeenCalledTimes(1);
        expect(sov.publishedStateEnum()).toBe(COMMON.ePublishedState.ePublished);
    });

    test('skips the write when the state is already the intended one', async () => {
        const sov = fakeSOV(COMMON.ePublishedState.ePublished);
        (ps as any).systemObjectVersion = sov;
        const ok = await (ps as any).updatePublishedState(undefined, COMMON.ePublishedState.ePublished);
        expect(ok).toBe(true);
        expect(sov.update).not.toHaveBeenCalled();
    });

    test('a restrictive license forces NotPublished regardless of the intended state', async () => {
        const sov = fakeSOV(COMMON.ePublishedState.eNotPublished);
        (ps as any).systemObjectVersion = sov;
        const LR = { License: { RestrictLevel: 40 } } as any;   // > 30 -> NotPublished
        const ok = await (ps as any).updatePublishedState(LR, COMMON.ePublishedState.ePublished);
        expect(ok).toBe(true);
        expect(sov.publishedStateEnum()).toBe(COMMON.ePublishedState.eNotPublished);
        expect(sov.update).not.toHaveBeenCalled();               // already NotPublished -> no write
    });

    test('returns false when the SOV update fails', async () => {
        expectLogErrors('Publish.Scene');
        const sov = fakeSOV(COMMON.ePublishedState.eNotPublished, false);
        (ps as any).systemObjectVersion = sov;
        expect(await (ps as any).updatePublishedState(undefined, COMMON.ePublishedState.ePublished)).toBe(false);
    });
});
