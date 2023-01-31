/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as LOG from '../logger';
import * as H from '../helpers';
import * as SVX from '../../types/voyager';
import * as THREE from 'three';
import * as COMMON from '@dpo-packrat/common';

export type SvxNonModelAsset = {
    uri: string;
    type: 'Image' | 'Article';
    description?: string | undefined;
    size?: number | undefined;
    idAssetVersion?: number | undefined;
};

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

    metaImages: SVX.IImage[] | null = null;
    metaArticles: SVX.IArticle[] | null = null;
    modelAssets: SVX.IAsset[] | null = null;
    nonModelAssets: SvxNonModelAsset[] | null = null;

    extractScene(): DBAPI.Scene {
        // first, attempt to extract Name and Title from metas -> collection -> title(s), metas -> collection -> titlesceneTitle
        let title: string = '';
        let sceneTitle: string = '';
        if (this.document.metas !== undefined) {
            for (const meta of this.document.metas) {
                if (meta.collection) {
                    if (title === '') // first, try meta.collection.title
                        title = this.extractTitleFromCollectionElement(meta.collection['title']);
                    if (title === '') // next, try meta.collection.titles
                        title = this.extractTitleFromCollectionElement(meta.collection['titles']);

                    if (sceneTitle === '' && meta.collection['sceneTitle'])
                        sceneTitle = meta.collection['sceneTitle'];
                    if (title && sceneTitle)
                        break;
                }
            }
        }

        // if we didn't get a name, try again from scenes -> name
        if (title === '') {
            if (this.document.scene !== undefined &&                    // we have a specific scene index
                this.document.scenes &&                                 // we have a list of scenes
                (this.document.scenes.length > this.document.scene))    // we have that specific scene
                title = this.document.scenes[this.document.scene].name ?? '';
        }

        return new DBAPI.Scene({
            Name: title + ((sceneTitle && !title.includes(sceneTitle)) ? `: ${sceneTitle}` : ''),
            Title: sceneTitle,
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

    extractUnits(): COMMON.eVocabularyID | undefined {
        // scenes[scene].units
        if (this.document.scene === undefined)
            return undefined;
        if (this.document.scenes === undefined)
            return undefined;
        if (this.document.scene >= this.document.scenes.length)
            return undefined;
        const scene = this.document.scenes[this.document.scene];
        return CACHE.VocabularyCache.mapUnits(scene.units);
    }

    /** Pass in meta.collection['title'] and meta.collection['titles'] */
    private extractTitleFromCollectionElement(collectionTitle: any): string {
        if (!collectionTitle)
            return '';

        if (typeof collectionTitle === 'string')
            return collectionTitle;
        else if (typeof collectionTitle === 'object') {
            if (collectionTitle['EN'] && typeof collectionTitle['EN'] === 'string')
                return collectionTitle['EN'];
            else {
                for (const language in collectionTitle) {
                    if (typeof collectionTitle[language]  === 'string')
                        return collectionTitle[language];
                }
            }
        }
        return '';
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
        this.modelAssets = [];

        // extract nodes that correspond to our models, for use in determining tranlation, scale, and rotation
        const nodeModelMap: Map<number, SVX.INode> = new Map<number, SVX.INode>();
        if (this.document.nodes) {
            for (const node of this.document.nodes) {
                if (node.model !== undefined)
                    nodeModelMap.set(node.model, node);
            }
        }

        const modelTotal: number = this.document.models.length;
        for (let modelIndex: number = 0; modelIndex < modelTotal; modelIndex++) {
            let BoundingBoxP1X: number | null = null;
            let BoundingBoxP1Y: number | null = null;
            let BoundingBoxP1Z: number | null = null;
            let BoundingBoxP2X: number | null = null;
            let BoundingBoxP2Y: number | null = null;
            let BoundingBoxP2Z: number | null = null;

            const model = this.document.models[modelIndex];

            const modelMatrix: THREE.Matrix4            = new THREE.Matrix4();
            const hasModelTranslation: boolean          = (model.translation && Array.isArray(model.translation)  && model.translation.length  >= 3) ?? false;
            const hasModelRotation: boolean             = (model.rotation    && Array.isArray(model.rotation)     && model.rotation.length     >= 4) ?? false;
            const modelTranslation: THREE.Vector3       = hasModelTranslation ? new THREE.Vector3().fromArray(model.translation!) : new THREE.Vector3();              // eslint-disable-line @typescript-eslint/no-non-null-assertion
            const modelRotation: THREE.Quaternion       = hasModelRotation    ? new THREE.Quaternion().fromArray(model.rotation!) : new THREE.Quaternion();           // eslint-disable-line @typescript-eslint/no-non-null-assertion
            modelMatrix.compose(modelTranslation, modelRotation, new THREE.Vector3().setScalar(1));

            // handle transformations applied at the "node" level for our model ... this can happen if the Voyager Story user edits the settings of a model
            const node: SVX.INode | undefined = nodeModelMap.get(modelIndex);
            if (node) {
                const hasTranslation: boolean           = (node.translation && Array.isArray(node.translation)  && node.translation.length  >= 3) ?? false;
                const hasRotation: boolean              = (node.rotation    && Array.isArray(node.rotation)     && node.rotation.length     >= 4) ?? false;
                const hasScale: boolean                 = (node.scale       && Array.isArray(node.scale)        && node.scale.length        >= 3) ?? false;

                const nodeTranslation: THREE.Vector3    = hasTranslation ? new THREE.Vector3().fromArray(node.translation!) : new THREE.Vector3();              // eslint-disable-line @typescript-eslint/no-non-null-assertion
                const nodeRotation: THREE.Quaternion    = hasRotation    ? new THREE.Quaternion().fromArray(node.rotation!) : new THREE.Quaternion();           // eslint-disable-line @typescript-eslint/no-non-null-assertion
                const nodeScale: THREE.Vector3          = hasScale       ? new THREE.Vector3().fromArray(node.scale!)       : new THREE.Vector3().setScalar(1); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                const nodeMatrix: THREE.Matrix4 = new THREE.Matrix4();
                nodeMatrix.compose(nodeTranslation, nodeRotation, nodeScale);
                modelMatrix.multiply(nodeMatrix);
                LOG.info(`svxReader.extractModelDetails nodeMatrix=${JSON.stringify(nodeMatrix)}`, LOG.LS.eSYS);
            }

            const finalTranslation: THREE.Vector3   = new THREE.Vector3();
            const finalRotation: THREE.Quaternion   = new THREE.Quaternion();
            const finalScale: THREE.Vector3         = new THREE.Vector3().setScalar(1);
            modelMatrix.decompose(finalTranslation, finalRotation, finalScale);
            LOG.info(`svxReader.extractModelDetails modelMatrix=${JSON.stringify(modelMatrix)}`, LOG.LS.eSYS);

            const TS0: number = finalTranslation.x;
            const TS1: number = finalTranslation.y;
            const TS2: number = finalTranslation.z;
            const R0: number = finalRotation.x;
            const R1: number = finalRotation.y;
            const R2: number = finalRotation.z;
            const R3: number = finalRotation.w;
            const S0: number = finalScale.x;
            const S1: number = finalScale.y;
            const S2: number = finalScale.z;

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
                    this.modelAssets.push(asset);

                    if (derivative.usage !== 'Image2D') {   // Skip image derivatives here
                        const xref: DBAPI.ModelSceneXref = new DBAPI.ModelSceneXref({
                            idModelSceneXref: 0, idModel: 0, idScene: 0, Name: asset.uri, Usage: derivative.usage, Quality: derivative.quality,
                            FileSize: asset.byteSize !== undefined ? BigInt(asset.byteSize) : null, UVResolution: asset.imageSize || null,
                            BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z,
                            TS0, TS1, TS2, R0, R1, R2, R3, S0, S1, S2
                        });

                        this.modelDetails.push(xref);
                    }
                }
            }
        }
        return true;
    }

    private extractNonModelDetails(): boolean {
        const metaImages: SVX.IImage[] = [];
        const metaArticles: SVX.IArticle[] = [];
        const nonModelAssets: SvxNonModelAsset[] = [];

        if (this.document.metas) {
            for (const meta of this.document.metas) {
                if (meta.images) {
                    for (const image of meta.images) {
                        metaImages.push(image);
                        nonModelAssets.push({ uri: image.uri, type: 'Image', description: image.quality, size: image.byteSize });
                    }
                }

                if (meta.articles) {
                    for (const article of meta.articles) {
                        metaArticles.push(article);
                        if (article.uri)
                            nonModelAssets.push({ uri: article.uri, type: 'Article', description: article.title });
                        else if (article.uris) {
                            for (const [lang, uri] of Object.entries(article.uris)) {
                                let description: string | undefined = article.titles ? article.titles[lang] : undefined;
                                if (description === undefined)
                                    description = article.title;
                                nonModelAssets.push({ uri, type: 'Article', description });
                            }
                        }
                    }
                }
            }
        }

        if (metaImages.length > 0)
            this.metaImages = metaImages;
        if (metaArticles.length > 0)
            this.metaArticles = metaArticles;
        if (nonModelAssets.length > 0)
            this.nonModelAssets = nonModelAssets;

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
        svx.extractNonModelDetails();
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
            // LOG.info(`svxReader.loadFromJSON\n${json}`, LOG.LS.eSYS);
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