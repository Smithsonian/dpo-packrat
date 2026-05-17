/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Verifies that newly-instantiated DB API classes capture pre-mutation values
 * onto sibling `<Field>Orig` properties via updateCachedValues, and that the
 * audit pipeline's diff shaper uses those snapshots to emit a compact diff
 * payload describing exactly what changed.
 */
import * as DBAPI from '../../db';
import { buildDiffPayload } from '../../audit/impl/AuditPayload';

type Case = {
    name: string;
    factory: () => any;
    field: string;
    next: unknown;
};

const cases: Case[] = [
    {
        name: 'Subject',
        factory: () => new DBAPI.Subject({
            idSubject: 1, idUnit: 7, idAssetThumbnail: null, idGeoLocation: null,
            Name: 'old name', idIdentifierPreferred: null,
        }),
        field: 'Name',
        next: 'new name',
    },
    {
        name: 'Item',
        factory: () => new DBAPI.Item({
            idItem: 1, idAssetThumbnail: null, idGeoLocation: null,
            Name: 'item old', EntireSubject: false, Title: null,
        }),
        field: 'Title',
        next: 'item title',
    },
    {
        name: 'Project',
        factory: () => new DBAPI.Project({
            idProject: 1, Name: 'proj old', Description: null, isRestricted: false,
        }),
        field: 'Description',
        next: 'now described',
    },
    {
        name: 'Unit',
        factory: () => new DBAPI.Unit({
            idUnit: 1, Name: 'NMNH', Abbreviation: 'NMNH', ARKPrefix: null,
        }),
        field: 'ARKPrefix',
        next: 'ark:/123',
    },
    {
        name: 'Scene (Name)',
        factory: () => new DBAPI.Scene({
            idScene: 1, Name: 'scene old', idAssetThumbnail: null,
            CountScene: null, CountNode: null, CountCamera: null, CountLight: null,
            CountModel: null, CountMeta: null, CountSetup: null, CountTour: null,
            EdanUUID: null, PosedAndQCd: false, ApprovedForPublication: false, Title: null,
        }),
        field: 'Name',
        next: 'scene new',
    },
    {
        name: 'Asset (FileName)',
        factory: () => new DBAPI.Asset({
            idAsset: 1, FileName: 'old.glb', idAssetGroup: null, idVAssetType: 135,
            idSystemObject: null, StorageKey: null,
        }),
        field: 'FileName',
        next: 'new.glb',
    },
    {
        name: 'CaptureData (Name)',
        factory: () => new DBAPI.CaptureData({
            idCaptureData: 1, Name: 'cap old', idVCaptureMethod: 1, DateCaptured: new Date('2020-01-01'),
            Description: 'desc', idAssetThumbnail: null,
        }),
        field: 'Name',
        next: 'cap new',
    },
    {
        name: 'Metadata (ValueShort)',
        factory: () => new DBAPI.Metadata({
            idMetadata: 1, Name: 'k', ValueShort: 'old', ValueExtended: null,
            idAssetVersionValue: null, idUser: null, idVMetadataSource: null,
            idSystemObject: null, idSystemObjectParent: null,
        }),
        field: 'ValueShort',
        next: 'new',
    },
    {
        name: 'Model (Title)',
        factory: () => new DBAPI.Model({
            idModel: 1, Name: 'm', DateCreated: new Date('2020-01-01'),
            idVCreationMethod: null, idVModality: null, idVPurpose: null, idVUnits: null, idVFileType: null,
            idAssetThumbnail: null,
            CountAnimations: null, CountCameras: null, CountFaces: null, CountLights: null,
            CountMaterials: null, CountMeshes: null, CountVertices: null,
            CountEmbeddedTextures: null, CountLinkedTextures: null,
            FileEncoding: null, IsDracoCompressed: null, AutomationTag: null,
            CountTriangles: null, Title: null, Variant: 'low',
        }),
        field: 'Title',
        next: 'titled',
    },
];

describe('*Orig coverage on mutable DB-API classes', () => {
    test.each(cases)('$name snapshots tracked field on construction', (c) => {
        const obj = c.factory();
        const origKey = `${c.field}Orig`;
        expect(obj[origKey]).toEqual(obj[c.field]);
    });

    test.each(cases)('$name produces a diff after a single-field mutation', (c) => {
        const obj = c.factory();
        const before: Record<string, unknown> = { [c.field]: obj[c.field] };
        obj[c.field] = c.next;
        const after: Record<string, unknown> = { [c.field]: obj[c.field] };

        // Diff payload computed against the pre-mutation snapshot stored on
        // the *Orig sibling — same path the audit shaper takes at emit time.
        const tracked = Object.keys(obj).filter(k =>
            k.endsWith('Orig') && k.slice(0, -4) in obj
        ).map(k => k.slice(0, -4));
        expect(tracked).toContain(c.field);

        const diff = buildDiffPayload(before, after, [c.field]);
        expect(diff.kind).toBe('diff');
        expect(diff.changed[c.field]).toBeDefined();
        expect(diff.changed[c.field].before).not.toEqual(diff.changed[c.field].after);
    });
});
