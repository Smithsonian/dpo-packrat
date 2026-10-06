/* eslint-disable @typescript-eslint/no-explicit-any */
import { PublishScene } from '../../collections/impl/PublishScene';
import * as COMMON from '@dpo-packrat/common';
import { parityCheck } from './parityHarness';

// Parity surface: the EDAN publish flag matrix (TR-15a). computeEdanSearchFlags
// maps (published state x license restrict level) -> { status, publicSearch,
// downloads } — the contract that decides how a scene appears on/off the 3D site
// and whether downloads are offered. It is pure (no DB/EDAN/storage), so it is
// fully deterministic and committable now; a divergence on the migrated server
// would mean published scenes get different EDAN visibility/downloads.

describe('Parity: EDAN publish flag matrix', () => {
    test('flag matrix across published states and license restrict levels', () => {
        const ps: any = new PublishScene(0);
        const states: COMMON.ePublishedState[] = [
            COMMON.ePublishedState.eNotPublished,
            COMMON.ePublishedState.eAPIOnly,
            COMMON.ePublishedState.ePublished,
            COMMON.ePublishedState.eInternal,
        ];
        const restrictLevels: Array<number | undefined> = [undefined, 0, 10, 20, 30, 40];

        const matrix: any[] = [];
        for (const state of states) {
            for (const rl of restrictLevels) {
                const LR = rl === undefined ? undefined : ({ License: { RestrictLevel: rl } } as any);
                const flags = ps.computeEdanSearchFlags({ status: 0, publicSearch: false } as any, state, LR);
                matrix.push({
                    state: COMMON.ePublishedState[state],
                    restrictLevel: rl ?? null,
                    status: flags.status,
                    publicSearch: flags.publicSearch,
                    downloads: flags.downloads,
                });
            }
        }
        parityCheck('edan-publish-flag-matrix', matrix);
    });
});
