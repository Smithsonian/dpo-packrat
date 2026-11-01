/* eslint-disable @typescript-eslint/no-explicit-any, camelcase */
import { EdanCollection } from '../../collections/impl';
import * as COL from '../../collections/interface';
import { parityCheck, maskVolatile } from './parityHarness';

// Parity surface: the JSON bodies the publish pipeline WOULD send to EDAN,
// captured at the BUILDER BOUNDARY. createEdanMDM / createEdan3DPackage
// / updateEdan3DPackage each assemble a wire body and funnel it through the single
// private sendRequest choke point. We spy sendRequest so nothing is sent (no live
// EDAN write) and record the exact stringified body. Inputs are fixed, so the bodies
// are deterministic; the baseline locks the content->wire-body contract — the
// 'edanmdm:'/'3d_package' url + type tags, the status/publicSearch placement, and the
// .zip-stripping on update. This is the highest-stakes external contract (it encodes
// what is published and downloadable), so a bless here is a reviewed security change.
//
// Residual: the full E3DPackage that PublishScene.publish() assembles end-to-end
// (extractResource url templates + svx document + media_usage derived from a live
// scene) stays un-baselined here — it needs the Cook-replay/storage seam and is
// tracked with that work.

// A representative edanmdm record. Values are fixed (no dates/uuids) so the captured
// body is byte-stable; the normalize hook is a safety net for any volatile string.
const EDANMDM: COL.EdanMDMContent = {
    descriptiveNonRepeating: {
        title: { label: 'Title', content: 'Parity Test Object' },
        data_source: 'Smithsonian Parity Test',
        record_ID: 'parity_test_record',
        unit_code: 'DPO',
        title_sort: 'PARITY TEST OBJECT',
        online_media: { media: [], mediaCount: '0' },
    },
    indexedStructured: { object_type: ['3D Model'] },
    freetext: {
        identifier: [{ label: 'ARK', content: 'ark:/65665/parity-test' }],
        dataSource: [{ label: 'Data Source', content: 'Smithsonian Parity Test' }],
    },
};

const PACKAGE: COL.Edan3DPackageContent = {
    document: { asset: { version: '1.0', generator: 'parity', copyright: '' } } as any,
    resources: [{
        filename: 'parity-full.zip',
        url: 'https://3d-api.si.edu/content/document/3d_package:PARITY_PACKAGE/resources/parity-full.zip',
        type: '3D mesh',
        category: 'Full_resolution',
        title: 'Parity Test Object (Full resolution 3D mesh, obj, scale in mm)',
        name: 'Parity Test Object',
        attributes: [{ UNITS: 'mm', MODEL_FILE_TYPE: 'obj', FILE_TYPE: 'zip' }],
    }],
    media_usage: { access: 'CC0', text: 'Usage conditions apply', codes: '' },
};

describe('Parity: EDAN publish payload bodies (builder boundary)', () => {
    let edan: EdanCollection;
    let spy: jest.SpyInstance;

    beforeAll(() => {
        edan = new EdanCollection();
        // Intercept the single transport choke point (createEdanMDM/createEdan3DPackage/
        // updateEdan3DPackage -> upsertContent/upsertResource -> sendRequest). Record
        // nothing here; each test reads the captured body. Return a minimal valid
        // EdanRecord so the builder resolves and runs its post-send body shaping.
        spy = jest.spyOn(EdanCollection.prototype as any, 'sendRequest').mockImplementation(async () => {
            const fakeRecord: Partial<COL.EdanRecord> = {
                id: 'parity-edan-id', url: 'edanmdm:parity_test_record', type: '3d_package',
                status: 3, publicSearch: true, content: {},
            };
            return { success: true, statusText: 'OK', output: JSON.stringify({ response: fakeRecord }) };
        });
    });

    afterAll(() => {
        spy.mockRestore();
    });

    // The stringified wire body is the 5th argument to sendRequest; read the last call.
    async function captureBody(fn: () => Promise<unknown>): Promise<any> {
        spy.mockClear();
        await fn();
        const calls: any[] = spy.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        return JSON.parse(calls[calls.length - 1][4]);
    }

    const normalize = (d: any): unknown => maskVolatile(d);

    test('createEdanMDM -> upsertContent body (edanmdm)', async () => {
        const body = await captureBody(() => edan.createEdanMDM(EDANMDM, 3, true));
        parityCheck('edan-createmdm-body', body, normalize);
    });

    test('createEdan3DPackage -> upsertResource body (resource)', async () => {
        const body = await captureBody(() => edan.createEdan3DPackage('parity-shared-name', 'scene.svx.json'));
        parityCheck('edan-create3dpackage-body', body, normalize);
    });

    test('updateEdan3DPackage -> upsertContent body (3d_package, .zip stripped)', async () => {
        const body = await captureBody(() => edan.updateEdan3DPackage('edanmdm:parity_test_record.zip', 'Parity Title', PACKAGE, 3, true));
        parityCheck('edan-update3dpackage-body', body, normalize);
    });
});
