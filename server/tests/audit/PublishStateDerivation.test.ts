import * as COMMON from '@dpo-packrat/common';
import {
    derivePublishedState,
    isPublishedState,
    parsePublishedStateFromAudit,
    PublishedStateVersion,
} from '../../graphql/schema/systemobject/resolvers/queries/getSystemObjectDetails';

// Build a publish/unpublish audit payload string in the shape publish.ts / RetireExecutorDeps.ts emit.
function auditData(afterState: COMMON.ePublishedState | null): string {
    return JSON.stringify({
        before: { eState: null, eStateName: null },
        after: { eState: afterState, eStateName: afterState !== null ? COMMON.ePublishedState[afterState] : null },
    });
}

function version(id: number, published: COMMON.ePublishedState, dateCreated: Date): PublishedStateVersion {
    return { idSystemObjectVersion: id, published, dateCreated };
}

const PUBLISH_EVENT = new Date('2026-06-01T00:00:00Z');
const BEFORE_PUBLISH = new Date('2026-05-01T00:00:00Z');
const AFTER_PUBLISH = new Date('2026-07-01T00:00:00Z');

describe('parsePublishedStateFromAudit', () => {
    test('reads after.eState for a publish event', () => {
        expect(parsePublishedStateFromAudit(auditData(COMMON.ePublishedState.ePublished)))
            .toBe(COMMON.ePublishedState.ePublished);
    });

    test('reads eNotPublished (0) for an unpublish event', () => {
        expect(parsePublishedStateFromAudit(auditData(COMMON.ePublishedState.eNotPublished)))
            .toBe(COMMON.ePublishedState.eNotPublished);
    });

    test('null / empty / malformed / unknown payloads yield null (legacy fallback)', () => {
        expect(parsePublishedStateFromAudit(null)).toBeNull();
        expect(parsePublishedStateFromAudit('')).toBeNull();
        expect(parsePublishedStateFromAudit('{not json')).toBeNull();
        expect(parsePublishedStateFromAudit(JSON.stringify({ after: {} }))).toBeNull();
        expect(parsePublishedStateFromAudit(JSON.stringify({ after: { eState: 999 } }))).toBeNull();
        expect(parsePublishedStateFromAudit(JSON.stringify({ after: { eState: 'Published' } }))).toBeNull();
    });
});

describe('isPublishedState', () => {
    test('Public / Public-Unlisted / Internal are published; Not Published is not', () => {
        expect(isPublishedState(COMMON.ePublishedState.ePublished)).toBe(true);
        expect(isPublishedState(COMMON.ePublishedState.eAPIOnly)).toBe(true);
        expect(isPublishedState(COMMON.ePublishedState.eInternal)).toBe(true);
        expect(isPublishedState(COMMON.ePublishedState.eNotPublished)).toBe(false);
    });
});

describe('derivePublishedState — audit-derived current state', () => {
    // Case 1: published then unpublished -> latest event is the unpublish.
    test('Case 1: publish then unpublish -> Not Published, no draft', () => {
        const latest = version(2, COMMON.ePublishedState.eNotPublished, AFTER_PUBLISH);
        const result = derivePublishedState(COMMON.ePublishedState.eNotPublished, AFTER_PUBLISH, latest, []);
        expect(result.publishedEnum).toBe(COMMON.ePublishedState.eNotPublished);
        expect(result.isDraft).toBe(false);
    });

    // Case 3: published, then content edited -> still Public, and now a draft.
    test('Case 3: published then edited (newer content) -> Public + draft', () => {
        const latest = version(3, COMMON.ePublishedState.eNotPublished, AFTER_PUBLISH); // edit rolled a fresh SOV
        const result = derivePublishedState(COMMON.ePublishedState.ePublished, PUBLISH_EVENT, latest, []);
        expect(result.publishedEnum).toBe(COMMON.ePublishedState.ePublished);
        expect(result.isDraft).toBe(true);
    });

    // Published with no later edit: latest SOV predates the publish event -> not a draft.
    test('published, no later edit -> Public, no draft', () => {
        const latest = version(1, COMMON.ePublishedState.ePublished, BEFORE_PUBLISH);
        const result = derivePublishedState(COMMON.ePublishedState.ePublished, PUBLISH_EVENT, latest, []);
        expect(result.publishedEnum).toBe(COMMON.ePublishedState.ePublished);
        expect(result.isDraft).toBe(false);
    });

    // Re-publish clears the draft: a fresh publish event newer than the latest content.
    test('re-publish after edit -> draft cleared', () => {
        const latest = version(3, COMMON.ePublishedState.eNotPublished, PUBLISH_EVENT);
        const result = derivePublishedState(COMMON.ePublishedState.ePublished, AFTER_PUBLISH, latest, []);
        expect(result.isDraft).toBe(false);
    });

    // Pathological: publish -> edit -> unpublish. The unpublish event wins; the version chain (whose
    // last "published" row lingers) would wrongly report Public.
    test('Pathological: publish, edit, unpublish -> Not Published, no draft', () => {
        const latest = version(4, COMMON.ePublishedState.eNotPublished, AFTER_PUBLISH);
        const result = derivePublishedState(COMMON.ePublishedState.eNotPublished, AFTER_PUBLISH, latest, []);
        expect(result.publishedEnum).toBe(COMMON.ePublishedState.eNotPublished);
        expect(result.isDraft).toBe(false);
    });

    // Unpublished state never carries a draft suffix even if content is newer than the event.
    test('unpublished with newer content -> not a draft', () => {
        const latest = version(5, COMMON.ePublishedState.eNotPublished, AFTER_PUBLISH);
        const result = derivePublishedState(COMMON.ePublishedState.eNotPublished, PUBLISH_EVENT, latest, []);
        expect(result.isDraft).toBe(false);
    });
});

describe('derivePublishedState — legacy fallback (no audit event)', () => {
    // Case 2: never published, no event, no published version.
    test('Case 2: never published -> Not Published, no draft', () => {
        const v1 = version(1, COMMON.ePublishedState.eNotPublished, BEFORE_PUBLISH);
        const result = derivePublishedState(null, null, v1, [v1]);
        expect(result.publishedEnum).toBe(COMMON.ePublishedState.eNotPublished);
        expect(result.isDraft).toBe(false);
    });

    // Legacy published-then-edited: latest version newer than the last published version and itself
    // not published -> draft (mirrors the pre-existing version-chain heuristic).
    test('legacy: latest newer than last-published and unpublished -> draft', () => {
        const v1 = version(1, COMMON.ePublishedState.ePublished, BEFORE_PUBLISH);
        const v2 = version(2, COMMON.ePublishedState.eNotPublished, AFTER_PUBLISH);
        const result = derivePublishedState(null, null, v2, [v1, v2]);
        expect(result.publishedEnum).toBe(COMMON.ePublishedState.eNotPublished);
        expect(result.isDraft).toBe(true);
    });

    // Legacy still-published latest -> current state Public, not a draft.
    test('legacy: latest version is published -> Public, no draft', () => {
        const v1 = version(1, COMMON.ePublishedState.ePublished, BEFORE_PUBLISH);
        const result = derivePublishedState(null, null, v1, [v1]);
        expect(result.publishedEnum).toBe(COMMON.ePublishedState.ePublished);
        expect(result.isDraft).toBe(false);
    });

    // No versions at all -> Not Published.
    test('legacy: no versions -> Not Published', () => {
        const result = derivePublishedState(null, null, null, []);
        expect(result.publishedEnum).toBe(COMMON.ePublishedState.eNotPublished);
        expect(result.isDraft).toBe(false);
    });
});
