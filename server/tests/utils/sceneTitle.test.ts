/**
 * Unit tests for the scene-title helpers that enforce the Scene Title Contract:
 * SceneHelpers.ensureSceneTitle (seed/heal, fill-when-missing) and
 * SceneHelpers.copySceneTitle (preserve the original SVX title on regeneration).
 */
import { SceneHelpers } from '../../utils/sceneHelpers';
import * as DBAPI from '../../db';

const subject = (Name: string): DBAPI.Subject => ({ idSubject: 1, Name } as unknown as DBAPI.Subject);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const svx = (metas: any[]): Buffer => Buffer.from(JSON.stringify({ metas }));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const collectionOf = (buf: Buffer, idx = 0): any => JSON.parse(buf.toString()).metas[idx].collection;

describe('SceneHelpers.ensureSceneTitle', () => {
    test('new scene with no title is seeded with "Subject: Subtitle" and sceneTitle', async () => {
        const res = await SceneHelpers.ensureSceneTitle(svx([{ collection: {} }]), { subject: subject('Guam Sihek'), sceneTitle: 'Downloads Test (C)' });
        expect(res.modified).toBe(true);
        const col = collectionOf(res.buffer);
        expect(col.title).toBe('Guam Sihek: Downloads Test (C)');
        expect(col.sceneTitle).toBe('Downloads Test (C)');
    });

    test('combineExisting completes Cook\'s bare subject title', async () => {
        const res = await SceneHelpers.ensureSceneTitle(svx([{ collection: { title: 'Guam Sihek' } }]),
            { subject: subject('Guam Sihek'), sceneTitle: 'Downloads Test (C)', combineExisting: true });
        expect(res.modified).toBe(true);
        const col = collectionOf(res.buffer);
        expect(col.title).toBe('Guam Sihek: Downloads Test (C)');
        expect(col.sceneTitle).toBe('Downloads Test (C)');
    });

    test('combineExisting does not double-append a subtitle already present', async () => {
        const res = await SceneHelpers.ensureSceneTitle(svx([{ collection: { title: 'Guam Sihek: Downloads Test (C)', sceneTitle: 'Downloads Test (C)' } }]),
            { subject: subject('Guam Sihek'), sceneTitle: 'Downloads Test (C)', combineExisting: true });
        expect(res.modified).toBe(false);
        expect(res.title).toBe('Guam Sihek: Downloads Test (C)');
    });

    test('a user-edited title is preserved (combineExisting off), subtitle untouched when present', async () => {
        const res = await SceneHelpers.ensureSceneTitle(svx([{ collection: { title: 'My Cool Scene', sceneTitle: 'Downloads Test (C)' } }]),
            { subject: subject('Guam Sihek'), sceneTitle: 'Downloads Test (C)' });
        expect(res.modified).toBe(false);
        expect(collectionOf(res.buffer).title).toBe('My Cool Scene');
    });

    test('an existing title is preserved while a missing sceneTitle is filled', async () => {
        const res = await SceneHelpers.ensureSceneTitle(svx([{ collection: { title: 'My Cool Scene' } }]),
            { subject: subject('Guam Sihek'), sceneTitle: 'Downloads Test (C)' });
        expect(res.modified).toBe(true);
        const col = collectionOf(res.buffer);
        expect(col.title).toBe('My Cool Scene');
        expect(col.sceneTitle).toBe('Downloads Test (C)');
    });

    test('endsWith guard appends a subtitle that is a substring of the subject', async () => {
        const res = await SceneHelpers.ensureSceneTitle(svx([{ collection: {} }]), { subject: subject('Anatomy'), sceneTitle: 'A' });
        expect(collectionOf(res.buffer).title).toBe('Anatomy: A');
    });

    test('titles.EN counts as an existing title and is not overwritten', async () => {
        const res = await SceneHelpers.ensureSceneTitle(svx([{ collection: { titles: { EN: 'Existing' }, sceneTitle: 'Downloads Test (C)' } }]),
            { subject: subject('Guam Sihek'), sceneTitle: 'Downloads Test (C)' });
        expect(res.modified).toBe(false);
        expect(res.title).toBe('Existing');
    });

    test('no resolvable subject leaves the title empty but still fills the subtitle', async () => {
        const res = await SceneHelpers.ensureSceneTitle(svx([{ collection: {} }]), { sceneTitle: 'Downloads Test (C)' });
        const col = collectionOf(res.buffer);
        expect(col.title).toBeUndefined();
        expect(col.sceneTitle).toBe('Downloads Test (C)');
    });

    test('title and subtitle are co-located with edanRecordId, not a later title collection', async () => {
        const res = await SceneHelpers.ensureSceneTitle(
            svx([{ collection: { edanRecordId: 'edanmdm-x' } }, { collection: { title: 'Other' } }]),
            { subject: subject('Guam Sihek'), sceneTitle: 'Downloads Test (C)' });
        expect(res.modified).toBe(true);
        const target = collectionOf(res.buffer, 0);
        expect(target.title).toBe('Guam Sihek: Downloads Test (C)');
        expect(target.sceneTitle).toBe('Downloads Test (C)');
        expect(collectionOf(res.buffer, 1).title).toBe('Other'); // unrelated collection untouched
    });
});

describe('SceneHelpers.copySceneTitle', () => {
    test('carries the source title and subtitle onto the target edanRecordId collection', async () => {
        const source = svx([{ collection: { title: 'Original: Sub', sceneTitle: 'Sub' } }]);
        const target = svx([{ collection: { edanRecordId: 'edanmdm-x' } }]);
        const res = await SceneHelpers.copySceneTitle(target, source);
        expect(res.modified).toBe(true);
        const col = collectionOf(res.buffer);
        expect(col.title).toBe('Original: Sub');
        expect(col.sceneTitle).toBe('Sub');
        expect(col.edanRecordId).toBe('edanmdm-x'); // record id preserved
    });

    test('source with a titles.EN display title is carried over', async () => {
        const source = svx([{ collection: { titles: { EN: 'Original' } } }]);
        const res = await SceneHelpers.copySceneTitle(svx([{ collection: {} }]), source);
        expect(res.modified).toBe(true);
        expect(collectionOf(res.buffer).title).toBe('Original');
    });

    test('a source with no title leaves the target unchanged', async () => {
        const res = await SceneHelpers.copySceneTitle(svx([{ collection: { title: 'Keep Me' } }]), svx([{ collection: {} }]));
        expect(res.modified).toBe(false);
        expect(collectionOf(res.buffer).title).toBe('Keep Me');
    });
});
