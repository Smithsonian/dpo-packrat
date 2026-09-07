import * as COMMON from '@dpo-packrat/common';
import { predictCookOutput, findBasenameOffenders, cookOutputSuffixes, CookOutputPrediction, BasenameOffender } from '../../job/impl/Cook/CookOutputContract';

// Pure-function coverage for the shared Cook output contract. No DB or Cook needed. Proves the
// recipe-aware prediction and the single basename rule that both the pre-flight guard and the
// post-Cook verification run.
describe('Cook Output Contract', () => {
    const BASE: string = 'MyUnit-MyObject-1';

    describe('predictCookOutput', () => {
        test('si-generate-downloads predicts the 6 download suffixes plus .svx.json, as a closed set', () => {
            const prediction: CookOutputPrediction = predictCookOutput('si-generate-downloads', BASE);
            expect(prediction.closed).toBe(true);
            expect(prediction.filenames).toHaveLength(COMMON.CookDownloadDescriptors.length + 1);
            for (const suffix of COMMON.cookDownloadSuffixes('full'))
                expect(prediction.filenames).toContain(`${BASE}${suffix}`);
            expect(prediction.filenames).toContain(`${BASE}.svx.json`);
            // every predicted name shares the basename
            for (const name of prediction.filenames)
                expect(name.startsWith(BASE)).toBe(true);
        });

        test('si-voyager-scene predicts only the SVX name, as an open set (recipe-difference guard)', () => {
            const prediction: CookOutputPrediction = predictCookOutput('si-voyager-scene', BASE);
            expect(prediction.closed).toBe(false);
            expect(prediction.filenames).toEqual([`${BASE}.svx.json`]);
            // scene generation must NOT assert any of the 6 download suffixes
            for (const suffix of COMMON.cookDownloadSuffixes('full'))
                expect(prediction.filenames).not.toContain(`${BASE}${suffix}`);
        });
    });

    describe('cookOutputSuffixes', () => {
        test('downloads = full suffixes + .svx.json; scene = .svx.json only', () => {
            expect([...cookOutputSuffixes('si-generate-downloads')].sort())
                .toEqual([...COMMON.cookDownloadSuffixes('full'), '.svx.json'].sort());
            expect(cookOutputSuffixes('si-voyager-scene')).toEqual(['.svx.json']);
        });
    });

    describe('findBasenameOffenders (the shared rule)', () => {
        const predicted = (base: string): string[] => predictCookOutput('si-generate-downloads', base).filenames;

        test('first-run scene (no existing same-suffix assets) passes', () => {
            const existing: string[] = ['MyUnit-MyObject-1.obj', 'diffuse.jpg']; // source assets only
            const offenders: BasenameOffender[] = findBasenameOffenders('si-generate-downloads', predicted(BASE), existing);
            expect(offenders).toEqual([]);
        });

        test('matching basename passes (re-run with no rename)', () => {
            const existing: string[] = predicted(BASE); // scene already holds a full, matching set
            const offenders: BasenameOffender[] = findBasenameOffenders('si-generate-downloads', predicted(BASE), existing);
            expect(offenders).toEqual([]);
        });

        test('rename is blocked and every offender is reported, not just the first', () => {
            const oldBase: string = 'OldName-1';
            const existing: string[] = predicted(oldBase); // scene holds the stale full set
            const offenders: BasenameOffender[] = findBasenameOffenders('si-generate-downloads', predicted(BASE), existing);
            // one offender per shared suffix: the 6 downloads + the SVX descriptor
            expect(offenders).toHaveLength(COMMON.CookDownloadDescriptors.length + 1);
            for (const o of offenders) {
                expect(o.expected.startsWith(BASE)).toBe(true);
                expect(o.actual.startsWith(oldBase)).toBe(true);
            }
        });

        test('the .svx.json descriptor is checked (the hole the old prefix guard missed)', () => {
            // only the stale SVX is present; the prefix-only guard excluded .svx.json and would pass this
            const existing: string[] = ['OldName-1.svx.json'];
            const offenders: BasenameOffender[] = findBasenameOffenders('si-generate-downloads', predicted(BASE), existing);
            expect(offenders).toHaveLength(1);
            expect(offenders[0].suffix).toBe('.svx.json');
            expect(offenders[0].expected).toBe(`${BASE}.svx.json`);
            expect(offenders[0].actual).toBe('OldName-1.svx.json');
        });

        test('prefix-rename (Foo-Bar -> Foo) is now caught (old prefix guard passed it)', () => {
            // existing set built for 'Foo-Bar'; new run is 'Foo'. Old guard accepted startsWith('Foo-').
            const existing: string[] = predicted('Foo-Bar');
            const offenders: BasenameOffender[] = findBasenameOffenders('si-generate-downloads', predicted('Foo'), existing);
            expect(offenders.length).toBeGreaterThan(0);
        });

        test('post-Cook direction: Cook output vs existing stale asset yields an offender', () => {
            const incoming: string[] = predicted(BASE);           // Cook actually produced the new-name set
            const existing: string[] = ['OldName-1.svx.json'];    // scene still holds the old SVX
            const offenders: BasenameOffender[] = findBasenameOffenders('si-generate-downloads', incoming, existing);
            expect(offenders).toHaveLength(1);
        });

        test('scene-gen output is never evaluated against the download suffixes (recipe-difference guard)', () => {
            // a scene with stale downloads under an old name, evaluated as si-voyager-scene, only ever
            // asserts the SVX name — the 6 download suffixes are not part of the scene contract
            const existing: string[] = predictCookOutput('si-generate-downloads', 'OldName-1').filenames;
            const sceneCandidates: string[] = predictCookOutput('si-voyager-scene', BASE).filenames;
            const offenders: BasenameOffender[] = findBasenameOffenders('si-voyager-scene', sceneCandidates, existing);
            // only the SVX is compared; OldName SVX differs -> exactly one offender, never six-plus
            expect(offenders).toHaveLength(1);
            expect(offenders[0].suffix).toBe('.svx.json');
        });

        test('candidate with an unrecognized suffix is ignored, not flagged', () => {
            const offenders: BasenameOffender[] = findBasenameOffenders('si-generate-downloads', ['random.txt'], ['other.txt']);
            expect(offenders).toEqual([]);
        });
    });
});
