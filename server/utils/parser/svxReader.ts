/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as DBAPI from '../../db';
import * as LOG from '../logger';
import * as H from '../helpers';
import * as SVX from '../../types/voyager';

/** Create instances using the static SvxExtraction.extract() */
export class SvxExtraction {
    document: SVX.IDocument;
    modelDetails: DBAPI.ModelSceneXref[] | null = null;
    sceneCount: number = 0;
    nodeCount: number = 0;
    cameraCount: number = 0;
    lightCount: number = 0;
    modelCount: number = 0;
    metaCount: number = 0;
    setupCount: number = 0;
    tourCount: number = 0;

    extractScene(): DBAPI.Scene {
        let Name: string = '';
        if (this.document.scene !== undefined &&                    // we have a specific scene index
            this.document.scenes &&                                 // we have a list of scenes
            (this.document.scenes.length > this.document.scene))    // we have that specific scene
            Name = this.document.scenes[this.document.scene].name ?? '';

        return new DBAPI.Scene({
            Name,
            idAssetThumbnail: null,
            CountScene: this.sceneCount,
            CountNode: this.nodeCount,
            CountCamera: this.cameraCount,
            CountLight: this.lightCount,
            CountModel: this.modelCount,
            CountMeta: this.metaCount,
            CountSetup: this.setupCount,
            CountTour: this.tourCount,
            EdanUUID: null,
            PosedAndQCd: false,
            ApprovedForPublication: false,
            idScene: 0
        });
    }

    private constructor(document: SVX.IDocument) {
        this.document = document;
    }

    /** This method extracts and flattens the model details found in an SVX scene descriptor file.
     * In that file, each model may have multiple assets, typically representing different levels of detail
     * (though more complex representations are possible). Also, each model is "posed" with a translation
     * and rotation, both of which are applied to each asset.
     *
     * For Packrat, we extract the rotation and translation and place it into a ModelSceneXref record,
     * one without database IDs set (idModelSceneXref, idModel, and idScene). We marry and duplicate this
     * with the asset-specific information for each distinct asset
     */
    private extractModelDetails(): boolean {
        /* istanbul ignore next */
        if (!this.document.models)
            return false;
        this.modelDetails = [];
        for (const model of this.document.models) {
            let TS0, TS1, TS2, R0, R1, R2, R3: number | null = null;
            let BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z: number | null = null;
            if (model.translation && Array.isArray(model.translation) && model.translation.length >= 3) {
                TS0 = model.translation[0];
                TS1 = model.translation[1];
                TS2 = model.translation[2];
            }
            if (model.rotation && Array.isArray(model.rotation) && model.rotation.length >= 4) {
                R0 = model.rotation[0];
                R1 = model.rotation[1];
                R2 = model.rotation[2];
                R3 = model.rotation[3];
            }
            if (model.boundingBox) {
                if (Array.isArray(model.boundingBox.min) && model.boundingBox.min.length >= 3) {
                    BoundingBoxP1X = model.boundingBox.min[0];
                    BoundingBoxP1Y = model.boundingBox.min[1];
                    BoundingBoxP1Z = model.boundingBox.min[2];
                }
                if (Array.isArray(model.boundingBox.max) && model.boundingBox.max.length >= 3) {
                    BoundingBoxP2X = model.boundingBox.max[0];
                    BoundingBoxP2Y = model.boundingBox.max[1];
                    BoundingBoxP2Z = model.boundingBox.max[2];
                }
            }
            for (const derivative of model.derivatives) {
                for (const asset of derivative.assets) {
                    const xref: DBAPI.ModelSceneXref = new DBAPI.ModelSceneXref({
                        idModelSceneXref: 0, idModel: 0, idScene: 0, Name: asset.uri, Usage: derivative.usage, Quality: derivative.quality,
                        FileSize: asset.byteSize !== undefined ? BigInt(asset.byteSize) : null, UVResolution: asset.imageSize || null,
                        BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z,
                        TS0, TS1, TS2, R0, R1, R2, R3
                    });

                    this.modelDetails.push(xref);
                }
            }
        }
        return true;
    }

    static extract(document: any): { svx: SvxExtraction | null, results: H.IOResults } {
        if (!document)
            return { svx: null, results: { success: false, error: 'Missing document' } };
        if (document.asset === undefined)
            return { svx: null, results: { success: false, error: 'Missing asset' } };
        if (document.asset.type !== 'application/si-dpo-3d.document+json')
            return { svx: null, results: { success: false, error: `Incorrect asset.type: ${document.asset.type}` } };
        /*
        if (document.asset.version === undefined)
            return { svx: null, results: { success: false, error: 'Missing asset.version' } };
        if (document.scene === undefined)
            return { svx: null, results: { success: false, error: 'Missing scene' } };
        if (!document.scenes || !Array.isArray(document.scenes))
            return { svx: null, results: { success: false, error: 'Missing scenes' } };
        if (!document.nodes || !Array.isArray(document.nodes))
            return { svx: null, results: { success: false, error: 'Missing nodes' } };
        if (!document.cameras || !Array.isArray(document.cameras))
            return { svx: null, results: { success: false, error: 'Missing camera' } };
        if (!document.lights || !Array.isArray(document.lights))
            return { svx: null, results: { success: false, error: 'Missing lights' } };
        if (!document.models || !Array.isArray(document.models))
            return { svx: null, results: { success: false, error: 'Missing models' } };
        if (!document.metas || !Array.isArray(document.metas))
            return { svx: null, results: { success: false, error: 'Missing metas' } };
        if (!document.setups || !Array.isArray(document.setups))
            return { svx: null, results: { success: false, error: 'Missing setups' } };
        */
        const svx: SvxExtraction = new SvxExtraction(document);
        svx.sceneCount = document.scenes?.length ?? 0;
        svx.nodeCount = document.nodes?.length ?? 0;
        svx.cameraCount = document.cameras?.length ?? 0;
        svx.lightCount = document.lights?.length ?? 0;
        svx.modelCount = document.models?.length ?? 0;
        svx.metaCount = document.metas?.length ?? 0;
        svx.setupCount = document.setups?.length ?? 0;

        let tourCount: number = 0; /* istanbul ignore else */
        if (svx.document.setups) {
            for (const setup of svx.document.setups)
                tourCount += (setup.tours && Array.isArray(setup.tours)) ? setup.tours.length : 0;
        }
        svx.tourCount = tourCount;
        svx.extractModelDetails();
        return { svx, results: { success: true } };
    }
}

export class SvxReader {
    SvxDocument: SVX.IDocument | null = null;
    SvxExtraction: SvxExtraction | null = null;
    static DV: SVX.DocumentValidator = new SVX.DocumentValidator();

    async loadFromStream(readStream: NodeJS.ReadableStream): Promise<H.IOResults> {
        try {
            const buffer: Buffer | null = await H.Helpers.readFileFromStream(readStream);
            if (!buffer)
                return { success: false, error: 'Unable to read stream' };
            const json: string = buffer.toString();
            return this.loadFromJSON(json);
        } catch (err) /* istanbul ignore next */ {
            LOG.error('SvxReader.loadFromStream', LOG.LS.eSYS, err);
            return { success: false, error: `SvxReader.loadFromStream failed: ${JSON.stringify(err)}` };
        }
    }

    async loadFromJSON(json: string): Promise<H.IOResults> {
        try {
            const obj: any = JSON.parse(json);  // may throw an exception, if json is not valid JSON
            const validRes: H.IOResults = SvxReader.DV.validate(obj);
            if (!validRes.success) {
                const error: string = `SVX JSON Validation Failed: ${validRes.error}`;
                LOG.error(`SvxReader.loadFromJSON ${error}`, LOG.LS.eSYS);
                return { success: false, error };
            }

            const { svx, results } = SvxExtraction.extract(obj);
            if (!results.success)
                return results;

            this.SvxExtraction = svx; /* istanbul ignore next */
            if (!this.SvxExtraction || !this.SvxExtraction.document)
                return { success: false, error: 'Invalid SVX json' };

            this.SvxDocument = this.SvxExtraction.document;
            return { success: true };
        } catch (err) {
            const error: string = 'SvxReader.loadFromJSON failed processing invalid json';
            LOG.error(error, LOG.LS.eSYS, err);
            return { success: false, error };
        }
    }
}