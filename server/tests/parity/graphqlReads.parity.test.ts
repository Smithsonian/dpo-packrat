/* eslint-disable @typescript-eslint/no-explicit-any */
import GraphQLApi from '../../graphql';
import * as COMMON from '@dpo-packrat/common';
import { ASL, LocalStore } from '../../utils/localStore';
import { Authorization } from '../../auth/Authorization';
import type { AuthorizationContext } from '../../auth/Authorization';
import { ObjectGraphTestSetup } from '../db/composite/ObjectGraph.setup';
import { parityCheck, maskVolatile, stableStringify } from './parityHarness';

// Parity surface: the responses of the migration-critical GraphQL READ queries.
// We self-seed the canonical object graph (ObjectGraphTestSetup) and drive each query
// through GraphQLApi(true) — the documented test-only entry that bypasses Apollo/HTTP
// and re-establishes the ASL scope itself.
// The baseline locks the RESPONSE SHAPE (field set + enum/term/name values + structure)
// that the client and any downstream consumer depend on; a resolver whose output shape
// drifts on the migrated server would silently break them.
//
// Only id- and enum-addressed queries are captured. Search/list queries (getProjectList,
// getSubjectList, ...) scan the whole shared Packrat_test DB, whose row count grows as
// create-tests accumulate — their result sets are not reproducible, so they are
// intentionally excluded. unit1 is created fresh each run, so getSubjectsForUnit(unit1)
// and the seeded graph around it remain bounded and deterministic.
//
// Determinism: auto-increment ids, timestamps, and absolute paths/urls/hashes are
// canonicalized to placeholders; all arrays are sorted by their canonical serialization
// before capture (set-valued fields — ancestors, sourceObjects, metadata, asset rows —
// have no guaranteed emit order, and the harness only sorts object keys).

const OHTS: ObjectGraphTestSetup = new ObjectGraphTestSetup();

// id* fields are volatile auto-increment keys (idSystemObject, idObject, idModel,
// idVocabulary, idLicense, ...); so are a few that don't share the id* prefix: the
// random ARK `identifier`, its `identifierType` vocab id, `<Type>IdentifierPreferred`,
// and `licenseInheritance` (an idSystemObject reference). *date* fields are timestamps;
// thumbnails/urls/paths/hashes carry absolute or id-bearing values. Enum numbers
// (objectType, publishedEnum, RestrictLevel, colType, SortOrder) and *Name/Term/Title
// fields are stable and deliberately kept — note the exact-match keys below so the
// broad enum `*Type` fields are NOT caught.
const ID_KEYS: RegExp = /^id[A-Z]|^id$|^identifier$|^identifierType$|^licenseInheritance$|IdentifierPreferred$/;
const DATE_KEYS: RegExp = /date/i;
const PATH_KEYS: RegExp = /thumbnail|url|path|storagekey|storagehash/i;

// Sort every array by the canonical serialization of its (already masked) elements so
// unordered set-valued fields capture deterministically across runs/servers.
function sortDeep(value: any): any {
    if (Array.isArray(value)) {
        const mapped = value.map(sortDeep);
        return [...mapped].sort((a, b) => stableStringify(a).localeCompare(stableStringify(b)));
    }
    if (value !== null && typeof value === 'object')
        return Object.keys(value).reduce((acc: Record<string, unknown>, k: string) => {
            acc[k] = sortDeep(value[k]);
            return acc;
        }, {});
    return value;
}

const normalize = (d: any): unknown => sortDeep(maskVolatile(d, { idKeys: ID_KEYS, dateKeys: DATE_KEYS, pathKeys: PATH_KEYS }));

describe('Parity: GraphQL read-query responses', () => {
    let api: GraphQLApi;
    let ctx: any;
    let authSpy: jest.SpyInstance;

    beforeAll(async () => {
        await OHTS.initialize();
        await OHTS.wire();
        await OHTS.assignLicenses();

        api = new GraphQLApi(true);

        // Admin auth context so fail-closed access gates (getSystemObjectDetails ->
        // Authorization.canAccessSystemObject) resolve to allowed. Mirrors the resolver
        // test harness: enterWith an admin LocalStore and mock getContext directly,
        // since ASL.enterWith does not propagate reliably across Jest async hops.
        const adminContext: AuthorizationContext = {
            idUser: OHTS.user1!.idUser, isAdmin: true,
            authorizedUnitIds: [], authorizedProjectIds: [],
            effectiveProjectIds: null, effectiveProjectSOIds: null,
            effectiveUnitIds: [], effectiveUnitSOIds: null, authorizedUnitSOIds: null,
        };
        const adminLS: LocalStore = new LocalStore(true, OHTS.user1!.idUser);
        adminLS.authContext = adminContext;
        ASL.enterWith(adminLS);
        authSpy = jest.spyOn(Authorization, 'getContext').mockReturnValue(adminContext);

        ctx = { user: { idUser: OHTS.user1!.idUser } as any, isAuthenticated: true };
    });

    afterAll(() => {
        authSpy.mockRestore();
    });

    test('core read-query response shapes', async () => {
        const idSOModel1: number = (await OHTS.model1!.fetchSystemObject())!.idSystemObject;
        const idSOScene1: number = (await OHTS.scene1!.fetchSystemObject())!.idSystemObject;

        const responses: Record<string, any> = {
            // getSystemObjectDetails across the major object types — the richest read shape.
            detailsUnit: await api.getSystemObjectDetails({ idSystemObject: OHTS.idSOUnit1 }, ctx),
            detailsSubject: await api.getSystemObjectDetails({ idSystemObject: OHTS.idSOSubject1 }, ctx),
            detailsItem: await api.getSystemObjectDetails({ idSystemObject: OHTS.idSOItem1 }, ctx),
            detailsModel: await api.getSystemObjectDetails({ idSystemObject: idSOModel1 }, ctx),
            detailsScene: await api.getSystemObjectDetails({ idSystemObject: idSOScene1 }, ctx),

            objectsForItem: await api.getObjectsForItem({ idItem: OHTS.item1!.idItem }, ctx),
            subjectsForUnit: await api.getSubjectsForUnit({ idUnit: OHTS.unit1!.idUnit } as any, ctx),
            unit: await api.getUnit({ idUnit: OHTS.unit1!.idUnit }, ctx),
            projectDocumentation: await api.getProjectDocumentation({ idProjectDocumentation: OHTS.projectDocumentation1!.idProjectDocumentation }, ctx),

            detailsTabItem: await api.getDetailsTabDataForObject({ idSystemObject: OHTS.idSOItem1, objectType: COMMON.eSystemObjectType.eItem }, ctx),
            detailsTabModel: await api.getDetailsTabDataForObject({ idSystemObject: idSOModel1, objectType: COMMON.eSystemObjectType.eModel }, ctx),

            assetDetailsModel: await api.getAssetDetailsForSystemObject({ idSystemObject: idSOModel1 }, ctx),

            // Enum-addressed reference lookups (pollution-immune).
            vocabularyEntries: await api.getVocabularyEntries({ eVocabSetIDs: [
                COMMON.eVocabularySetID.eIdentifierIdentifierType,
                COMMON.eVocabularySetID.eCaptureDataCaptureMethod,
            ] }, ctx),
            license: await api.getLicense({ idLicense: OHTS.licenseCC0!.idLicense }, ctx),
        };

        parityCheck('graphql-read-responses', responses, normalize);
    });
});
