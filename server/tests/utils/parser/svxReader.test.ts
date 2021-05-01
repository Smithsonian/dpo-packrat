import fs from 'fs-extra';
import { join } from 'path';

import { SvxReader, SvxExtraction } from '../../../utils/parser';
import * as H from '../../../utils/helpers';
import * as LOG from '../../../utils/logger';

const mockScene = (folder: string, fileName: string) => join(__dirname, `../../mock/scenes/${folder}/${fileName}`);

afterAll(async done => {
    await H.Helpers.sleep(2000);
    done();
});

describe('SvxReader', () => {
    test('SvxReader.loadFromStream', async () => {
        const svxReader: SvxReader | null = await validateLoadFromStream('nmnh_sea_turtle-scene', 'scene.svx.json', true);
        expect(svxReader).toBeTruthy();
        if (svxReader && svxReader.SvxExtraction) {
            expect(svxReader.SvxExtraction.document).toBeTruthy();
            expect(svxReader.SvxExtraction.modelDetails).toBeTruthy();

            expect(svxReader.SvxExtraction.sceneCount).toEqual(1);
            expect(svxReader.SvxExtraction.nodeCount).toEqual(7);
            expect(svxReader.SvxExtraction.cameraCount).toEqual(1);
            expect(svxReader.SvxExtraction.lightCount).toEqual(4);
            expect(svxReader.SvxExtraction.modelCount).toEqual(1);
            expect(svxReader.SvxExtraction.metaCount).toEqual(1);
            expect(svxReader.SvxExtraction.setupCount).toEqual(1);
            expect(svxReader.SvxExtraction.tourCount).toEqual(0);

            if (svxReader.SvxExtraction.modelDetails) {
                expect(svxReader.SvxExtraction.modelDetails.length).toEqual(4);
                for (const modelDetail of svxReader.SvxExtraction.modelDetails) {
                    expect(modelDetail.xref.Usage).toEqual('Web3D');
                    expect(modelDetail.asset.type).toEqual('Model');
                }
            }
        }
    });

    test('SvxReader.loadFromStream invalid', async () => {
        expect(await validateLoadFromStream('invalid', 'DOES_NOT_EXIST.svx.json', false)).toBeFalsy();
        expect(await validateLoadFromStream('invalid', 'invalid.asset.svx.json', false)).toBeFalsy();
        expect(await validateLoadFromStream('invalid', 'invalid.asset-type.svx.json', false)).toBeFalsy();
        expect(await validateLoadFromStream('invalid', 'invalid.asset-version.svx.json', false)).toBeFalsy();
        expect(await validateLoadFromStream('invalid', 'invalid.cameras.svx.json', false)).toBeFalsy();
        expect(await validateLoadFromStream('invalid', 'invalid.lights.svx.json', false)).toBeFalsy();
        expect(await validateLoadFromStream('invalid', 'invalid.metas.svx.json', false)).toBeFalsy();
        expect(await validateLoadFromStream('invalid', 'invalid.models.svx.json', false)).toBeFalsy();
        expect(await validateLoadFromStream('invalid', 'invalid.nodes.svx.json', false)).toBeFalsy();
        expect(await validateLoadFromStream('invalid', 'invalid.scene.svx.json', false)).toBeFalsy();
        expect(await validateLoadFromStream('invalid', 'invalid.scenes.svx.json', false)).toBeFalsy();
        expect(await validateLoadFromStream('invalid', 'invalid.setups.svx.json', false)).toBeFalsy();
        expect(await validateLoadFromStream('invalid', 'invalid.json.svx.json', false)).toBeFalsy();

        expect(await validateLoadFromStream('invalid', 'invalid.model-trans.svx.json', true)).toBeTruthy();
    });

    test('SvxReader SvxExtraction', async () => {
        const { svx, results } = SvxExtraction.extract(null);
        expect(svx).toBeFalsy();
        expect(results.success).toBeFalsy();
    });
});

async function validateLoadFromStream(folder: string, fileName: string, expectSuccess: boolean): Promise<SvxReader | null> {
    const path = mockScene(folder, fileName);
    const readStream = fs.createReadStream(path);

    const svxReader: SvxReader = new SvxReader();
    const result: H.IOResults = await svxReader.loadFromStream(readStream);
    if (!expectSuccess) {
        expect(result.success).toBeFalsy();
        LOG.info(`SvxReader.loadFromStream ${folder}/${fileName} expected failure: ${result.error}`, LOG.LS.eTEST);
        return null;
    }

    if (!result.success)
        LOG.error(`SvxReader.loadFromStream: ${result.error}`, LOG.LS.eTEST);
    expect(result.success).toBeTruthy();
    expect(svxReader.SvxDocument).toBeTruthy();
    expect(svxReader.SvxExtraction).toBeTruthy();
    LOG.info(`SvxReader.loadFromStream ${folder}/${fileName} expected success`, LOG.LS.eTEST);
    return svxReader;
}