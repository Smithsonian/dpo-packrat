/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/brace-style */
import * as path from 'path';
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as STORE from '../../storage/interface';
import * as H from '../helpers';
import * as LOG from '../logger';
import { IngestPhotogrammetry, IngestModel, IngestScene, IngestFolder, Item } from '../../types/graphql';
import { IZip } from '../IZip';
import { CSVTypes, SubjectsCSVFields, ItemsCSVFields, CaptureDataPhotoCSVFields, ModelsCSVFields, ScenesCSVFields } from './csvTypes';
import { CSVParser } from './csvParser';

export type IngestMetadata = DBAPI.SubjectUnitIdentifier & Omit<Item, '__typename'> & (Omit<IngestPhotogrammetry, '__typename'> | Omit<IngestModel, '__typename'> | Omit<IngestScene, '__typename'>);

/** Provides access to bulk ingestion metadata, either from a bulk ingest bagit zip file, or from extracted metadata:
 * Our bulk ingest files can have any of the following metadata CSV files:
 * capture_data_photo.csv: specifies subject, unit, item, and photogrammetry capture set metadata, as well as the directory name in which the actual assets
 *      are found within the data folder of the bagit collection
 * models.csv: specifies subject, unit, item, and model metadata, as well as the directory name in which the actual assets are found
 *      within the data folder of the bagit collection
 */
export class BulkIngestReader {
    private _zip: IZip | null = null;
    private _ingestedMetadata: IngestMetadata[] = [];
    private _errorField: string | null = null;

    async loadFromAssetVersion(idAssetVersion: number, autoClose: boolean): Promise<H.IOResults> {
        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion);
        if (!assetVersion)
            return { success: false, error: `BulkIngestReader.load unable to fetch asset version ${idAssetVersion}` };

        const CAR: STORE.CrackAssetResult = await STORE.AssetStorageAdapter.crackAsset(assetVersion);
        if (!CAR.success || !CAR.zip)
            return { success: false, error: `BulkIngestReader.load unable to crack asset associated with asset version ${idAssetVersion}` };

        if (!CAR.isBagit) {
            await CAR.zip.close();
            return { success: false, error: `BulkIngestReader.load attempted to load non-bagit asset version ${idAssetVersion}` };
        }

        this._zip = CAR.zip;
        return await this.extractMetadata(autoClose);
    }

    async loadFromZip(zip: IZip, autoClose: boolean): Promise<H.IOResults> {
        this._zip = zip;
        return await this.extractMetadata(autoClose);
    }

    private async extractMetadata(autoClose: boolean): Promise<H.IOResults> {
        this._errorField = null;
        /* istanbul ignore next */
        if (!this._zip)
            return { success: false, error: 'BulkIngestReader.extractMetadata called with invalid zip' };

        const results = await this.extractMetadataWorker();

        if (autoClose) {
            const resultsClose = await this._zip.close();
            this._zip = null;
            return results.success ? resultsClose : results;
        } else
            return results;
    }

    private async extractMetadataWorker(): Promise<H.IOResults> {
        /* istanbul ignore next */
        if (!this._zip)
            return { success: false, error: 'BulkIngestReader.extractMetadata called with invalid zip' };

        let results: H.IOResults;
        // extract metadata for capture data
        let readStream: NodeJS.ReadableStream | null = await this._zip.streamContent('capture_data_photo.csv', true);
        if (readStream) {
            results = await this.computeCaptureDataPhotos(readStream); /* istanbul ignore if */
            if (!results.success)
                return results;
        }

        // extract metadata for models
        readStream = await this._zip.streamContent('models.csv', true);
        if (readStream) {
            results = await this.computeModels(readStream); /* istanbul ignore next */
            if (!results.success)
                return results;
        }

        // extract metadata for scenes
        readStream = await this._zip.streamContent('scenes.csv', true);
        if (readStream) {
            results = await this.computeScenes(readStream); /* istanbul ignore next */
            if (!results.success)
                return results;
        }

        if (this._ingestedMetadata.length > 0)
            return { success: true };
        else
            return { success: false, error: 'BulkIngestReader.extractMetadataWorker() found no metadata' };
    }

    async close(): Promise<H.IOResults> {
        this._errorField = null;

        /* istanbul ignore next */
        if (!this._zip)
            return { success: true };

        const res = await this._zip.close();
        this._zip = null;
        return res;
    }

    get ingestedObjects(): IngestMetadata[] {
        return this._ingestedMetadata;
    }

    static ingestedObjectIsPhotogrammetry(obj: (IngestPhotogrammetry | IngestModel | IngestScene)): obj is IngestPhotogrammetry {
        return (obj as IngestPhotogrammetry).lightsourceType !== undefined;
    }
    static ingestedObjectIsModel(obj: (IngestPhotogrammetry | IngestModel | IngestScene)): obj is IngestModel {
        return (obj as IngestModel).modality !== undefined;
    }
    static ingestedObjectIsScene(obj: (IngestPhotogrammetry | IngestModel | IngestScene)): obj is IngestScene {
        return (obj as IngestScene).approvedForPublication !== undefined;
    }

    static async computeProjects(ingestMetadata: IngestMetadata): Promise<DBAPI.Project[] | null> {
        if (!ingestMetadata.idSubject)
            return null;
        return await DBAPI.Project.fetchRelatedToSubjects([ingestMetadata.idSubject]);
    }

    private computeErrorFieldMessage(): string {
        return this._errorField ? ', due to an invalid ' + this._errorField : '';
    }

    private async computeCaptureDataPhotos(fileStream: NodeJS.ReadableStream): Promise<H.IOResults> {
        let bagitCDPs: (SubjectsCSVFields & ItemsCSVFields & CaptureDataPhotoCSVFields)[];
        try {
            bagitCDPs = await CSVParser.parse<SubjectsCSVFields & ItemsCSVFields & CaptureDataPhotoCSVFields>(fileStream, CSVTypes.captureDataPhoto);
        } catch (error) {
            LOG.info('BulkIngestReader.computeCaptureDataPhotos capture_data_photos.csv not found', LOG.LS.eSYS);
            return { success: true };
        }

        for (const bagitCDP of bagitCDPs) {
            /* istanbul ignore next */
            if (BulkIngestReader.isEmptyRow(bagitCDP))
                continue;

            const subject: DBAPI.SubjectUnitIdentifier | null = await this.extractSubjectFromCSV(bagitCDP); /* istanbul ignore next */
            if (!subject)
                return { success: false, error: `BulkIngestReader.computeCaptureDataPhotos could not compute subject from ${H.Helpers.JSONStringify(bagitCDP)}${this.computeErrorFieldMessage()}` };

            const item: DBAPI.Item | null = await this.extractItemFromCSV(bagitCDP); /* istanbul ignore next */
            if (!item)
                return { success: false, error: `BulkIngestReader.computeCaptureDataPhotos could not compute media group from ${H.Helpers.JSONStringify(bagitCDP)}${this.computeErrorFieldMessage()}` };

            const photo: IngestPhotogrammetry | null = await this.extractCaptureDataPhotoFromCSV(bagitCDP); /* istanbul ignore next */
            if (!photo)
                return { success: false, error: `BulkIngestReader.computeCaptureDataPhotos could not compute photogrammetry metadata from ${H.Helpers.JSONStringify(bagitCDP)}${this.computeErrorFieldMessage()}` };

            this._ingestedMetadata.push({ ...subject, ...item, ...photo });
        }
        return { success: true };
    }

    private async computeModels(fileStream: NodeJS.ReadableStream): Promise<H.IOResults> {
        let bagitModels: (SubjectsCSVFields & ItemsCSVFields & ModelsCSVFields)[];
        try {
            bagitModels = await CSVParser.parse<SubjectsCSVFields & ItemsCSVFields & ModelsCSVFields>(fileStream, CSVTypes.models);
        } catch (error) {
            LOG.info('BulkIngestReader.computeModels models.csv not found', LOG.LS.eSYS);
            return { success: true };
        }

        for (const bagitModel of bagitModels) {
            // LOG.info(`Processing model ${JSON.stringify(bagitModel)}`, LOG.LS.eSYS);
            if (BulkIngestReader.isEmptyRow(bagitModel))
                continue;

            const subject: DBAPI.SubjectUnitIdentifier | null = await this.extractSubjectFromCSV(bagitModel); /* istanbul ignore next */
            if (!subject)
                return { success: false, error: `BulkIngestReader.computeModels could not compute subject from ${H.Helpers.JSONStringify(bagitModel)}${this.computeErrorFieldMessage()}` };

            const item: DBAPI.Item | null = await this.extractItemFromCSV(bagitModel); /* istanbul ignore next */
            if (!item)
                return { success: false, error: `BulkIngestReader.computeModels could not compute media group from ${H.Helpers.JSONStringify(bagitModel)}${this.computeErrorFieldMessage()}` };

            const model: IngestModel | null = await this.extractModelFromCSV(bagitModel); /* istanbul ignore next */
            if (!model)
                return { success: false, error: `BulkIngestReader.computeModels could not compute model metadata from ${H.Helpers.JSONStringify(bagitModel)}${this.computeErrorFieldMessage()}` };

            this._ingestedMetadata.push({ ...subject, ...item, ...model });
        }
        return { success: true };
    }

    private async computeScenes(fileStream: NodeJS.ReadableStream): Promise<H.IOResults> {
        let bagitScenes: (SubjectsCSVFields & ItemsCSVFields & ScenesCSVFields)[];
        try {
            bagitScenes = await CSVParser.parse<SubjectsCSVFields & ItemsCSVFields & ScenesCSVFields>(fileStream, CSVTypes.scenes);
        } catch (error) {
            LOG.error('BulkIngestReader.computeScenes scenes.csv not found', LOG.LS.eSYS, error);
            return { success: true };
        }

        for (const bagitScene of bagitScenes) {
            LOG.info(`Processing scene ${JSON.stringify(bagitScene, H.Helpers.saferStringify)}`, LOG.LS.eSYS);
            if (BulkIngestReader.isEmptyRow(bagitScene))
                continue;

            const subject: DBAPI.SubjectUnitIdentifier | null = await this.extractSubjectFromCSV(bagitScene); /* istanbul ignore next */
            if (!subject)
                return { success: false, error: `BulkIngestReader.computeScenes could not compute subject from ${H.Helpers.JSONStringify(bagitScene)}${this.computeErrorFieldMessage()}` };

            const item: DBAPI.Item | null = await this.extractItemFromCSV(bagitScene); /* istanbul ignore next */
            if (!item)
                return { success: false, error: `BulkIngestReader.computeScenes could not compute media group from ${H.Helpers.JSONStringify(bagitScene)}${this.computeErrorFieldMessage()}` };

            const scene: IngestScene | null = await this.extractSceneFromCSV(bagitScene); /* istanbul ignore next */
            if (!scene)
                return { success: false, error: `BulkIngestReader.computeScenes could not compute scene metadata from ${H.Helpers.JSONStringify(bagitScene)}${this.computeErrorFieldMessage()}` };

            this._ingestedMetadata.push({ ...subject, ...item, ...scene });
        }
        return { success: true };
    }

    private static isEmptyRow(row: any): boolean {
        for (const value of Object.values(row))
            if (value)
                return false;
        return true;
    }

    private async extractSubjectFromCSV(bagitSubject: SubjectsCSVFields): Promise<DBAPI.SubjectUnitIdentifier | null> {
        // try to load from guid as a subject identifier
        const identifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromIdentifierValue(bagitSubject.subject_guid); /* istanbul ignore else */
        if (identifiers) {
            for (const identifier of identifiers) { /* istanbul ignore next */
                if (!identifier.idSystemObject)
                    continue;
                const SOPair: DBAPI.SystemObjectPairs | null = await DBAPI.SystemObjectPairs.fetch(identifier.idSystemObject); /* istanbul ignore else */
                if (SOPair && SOPair.Subject) {
                    const SUID: DBAPI.SubjectUnitIdentifier | null = await this.extractSubjectUnitIDFromSubject(SOPair.Subject, bagitSubject); /* istanbul ignore else */
                    if (SUID)
                        return SUID;
                }
            }
        }

        // otherwise, we can't spot this subject in our DB; validate unit name and then gather remaining information
        const units: DBAPI.Unit[] | null = await DBAPI.Unit.fetchFromNameSearch(bagitSubject.unit_name); /* istanbul ignore next */
        if (!units || units.length == 0) {
            this._errorField = 'unit_name';
            LOG.error(`BulkIngestReader.extractSubjectFromCSV unable to load unit from ${JSON.stringify(bagitSubject)}`, LOG.LS.eSYS);
            return null;
        }

        return { idSubject: 0, idSystemObject: 0, SubjectName: bagitSubject.subject_name, UnitAbbreviation: units[0].Abbreviation || /* istanbul ignore next */ '',
            IdentifierCollection: bagitSubject.subject_guid, IdentifierPublic: '' };
    }

    private async extractSubjectUnitIDFromSubject(subject: DBAPI.Subject | null,
        bagitSubject: SubjectsCSVFields): Promise<DBAPI.SubjectUnitIdentifier | null> {
        /* istanbul ignore next */
        if (!subject) {
            LOG.error(`BulkIngestReader.extractSubjectUnitIDFromSubject unable to load subject from local_subject_id in ${JSON.stringify(bagitSubject)}`, LOG.LS.eSYS);
            return null;
        }
        const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(subject.idUnit); /* istanbul ignore next */
        if (!unit) {
            LOG.error(`BulkIngestReader.extractSubjectUnitIDFromSubject unable to load unit from local_subject_id in ${JSON.stringify(bagitSubject)}`, LOG.LS.eSYS);
            return null;
        }

        const SO: DBAPI.SystemObject | null = await subject.fetchSystemObject();
        if (!SO) {
            LOG.error(`BulkIngestReader.extractSubjectUnitIDFromSubject unable to load system object from local_subject_id in ${JSON.stringify(bagitSubject)}`, LOG.LS.eSYS);
            return null;
        }

        const identifier: DBAPI.Identifier | null = (subject.idIdentifierPreferred)
            ? await DBAPI.Identifier.fetch(subject.idIdentifierPreferred)
            : /* istanbul ignore next */ null;
        return { idSubject: subject.idSubject, idSystemObject: SO.idSystemObject, SubjectName: subject.Name, UnitAbbreviation: unit.Abbreviation  || /* istanbul ignore next */ '',
            IdentifierCollection: identifier ? identifier.IdentifierValue : /* istanbul ignore next */ bagitSubject.subject_guid, IdentifierPublic: '' };
    }

    private async extractItemFromCSV(bagitItem: ItemsCSVFields): Promise<DBAPI.Item | null> {
        /* istanbul ignore next */
        if (!bagitItem.item_guid)
            return new DBAPI.Item({
                idItem: 0,
                EntireSubject: bagitItem.entire_subject != 0,
                idAssetThumbnail: null,
                idGeoLocation: null,
                Name: bagitItem.item_name,
                Title: bagitItem.item_subtitle,
            });

        // try to load from guid as a item identifier
        const error: string = `Unable to find identifiers for items from ${bagitItem.item_guid}`;
        const identifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromIdentifierValue(bagitItem.item_guid);
        if (!identifiers) {
            this._errorField = 'item_guid';
            LOG.error(error, LOG.LS.eSYS);
            return null;
        }

        for (const identifier of identifiers) {
            if (!identifier.idSystemObject)
                continue;
            const SOPair: DBAPI.SystemObjectPairs | null = await DBAPI.SystemObjectPairs.fetch(identifier.idSystemObject);
            if (SOPair && SOPair.Item) {
                return SOPair.Item;
            } else {
                this._errorField = 'item_guid';
                LOG.error(error, LOG.LS.eSYS);
                return null;
            }
        }

        this._errorField = 'item_guid';
        LOG.error(error, LOG.LS.eSYS);
        return null;
    }

    private async extractCaptureDataPhotoFromCSV(bagitCDP: CaptureDataPhotoCSVFields): Promise<IngestPhotogrammetry | null> {
        let vocabResult: { idVocabulary: number, error?: string | null };

        vocabResult = await this.computeVocabulary(COMMON.eVocabularySetID.eCaptureDataDatasetType, bagitCDP.capture_dataset_type);
        if (vocabResult.error)
        { LOG.error(vocabResult.error, LOG.LS.eSYS); this._errorField = 'capture_dataset_type'; return null; }
        const datasetType: number = vocabResult.idVocabulary;

        vocabResult = await this.computeVocabulary(COMMON.eVocabularySetID.eCaptureDataItemPositionType, bagitCDP.item_position_type);
        if (vocabResult.error)
        { LOG.error(vocabResult.error, LOG.LS.eSYS); this._errorField = 'item_position_type'; return null; }
        const itemPositionType: number = vocabResult.idVocabulary;

        vocabResult = await this.computeVocabulary(COMMON.eVocabularySetID.eCaptureDataFocusType, bagitCDP.focus_type);
        if (vocabResult.error)
        { LOG.error(vocabResult.error, LOG.LS.eSYS); this._errorField = 'focus_type'; return null; }
        const focusType: number = vocabResult.idVocabulary;

        vocabResult = await this.computeVocabulary(COMMON.eVocabularySetID.eCaptureDataLightSourceType, bagitCDP.light_source_type);
        if (vocabResult.error)
        { LOG.error(vocabResult.error, LOG.LS.eSYS); this._errorField = 'light_source_type'; return null; }
        const lightsourceType: number = vocabResult.idVocabulary;

        vocabResult = await this.computeVocabulary(COMMON.eVocabularySetID.eCaptureDataBackgroundRemovalMethod, bagitCDP.background_removal_method);
        if (vocabResult.error)
        { LOG.error(vocabResult.error, LOG.LS.eSYS); this._errorField = 'background_removal_method'; return null; }
        const backgroundRemovalMethod: number = vocabResult.idVocabulary;

        vocabResult = await this.computeVocabulary(COMMON.eVocabularySetID.eCaptureDataClusterType, bagitCDP.cluster_type);
        if (vocabResult.error)
        { LOG.error(vocabResult.error, LOG.LS.eSYS); this._errorField = 'cluster_type'; return null; }
        const clusterType: number = vocabResult.idVocabulary;

        const folders: IngestFolder[] = [];
        if (this._zip) {
            const directories: string[] = await this._zip.getJustDirectories(null);
            for (const directory of directories) {
                if (directory.toLowerCase().includes(bagitCDP.directory_path.toLowerCase())) {
                    const finalPathElement: string = path.basename(directory);
                    LOG.info(`BIR directory: ${directory}: ${finalPathElement}`, LOG.LS.eSYS);
                    const vocabulary: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapPhotogrammetryVariantType(finalPathElement);
                    folders.push({ name: finalPathElement, variantType: vocabulary ? vocabulary.idVocabulary : /* istanbul ignore next */ 0 });
                }
            }
        }

        // directory_path: string;
        return {
            idAssetVersion: 0,
            systemCreated: true, // TODO: not sure what is needed here
            name: bagitCDP.name,
            dateCaptured: bagitCDP.date_captured,
            datasetType,
            description: bagitCDP.description,
            cameraSettingUniform: false, // TODO: compute this!
            identifiers: [],
            folders,
            datasetFieldId: bagitCDP.capture_dataset_field_id,
            itemPositionType,
            itemPositionFieldId: bagitCDP.item_position_field_id,
            itemArrangementFieldId: bagitCDP.item_arrangement_field_id,
            focusType,
            lightsourceType,
            backgroundRemovalMethod,
            clusterType,
            clusterGeometryFieldId: bagitCDP.cluster_geometry_field_id,
            directory: bagitCDP.directory_path,
            sourceObjects: [],
            derivedObjects: []
        };
    }

    private async extractModelFromCSV(bagitModel: ModelsCSVFields): Promise<IngestModel | null> {
        let vocabResult: { idVocabulary: number, error?: string | null };

        vocabResult = await this.computeVocabulary(COMMON.eVocabularySetID.eModelCreationMethod, bagitModel.creation_method);
        if (vocabResult.error)
        { LOG.error(vocabResult.error, LOG.LS.eSYS); this._errorField = 'creation_method'; return null; }
        const creationMethod: number = vocabResult.idVocabulary;

        vocabResult = await this.computeVocabulary(COMMON.eVocabularySetID.eModelModality, bagitModel.modality);
        if (vocabResult.error)
        { LOG.error(vocabResult.error, LOG.LS.eSYS); this._errorField = 'modality'; return null; }
        const modality: number = vocabResult.idVocabulary;

        vocabResult = await this.computeVocabulary(COMMON.eVocabularySetID.eModelPurpose, bagitModel.purpose);
        if (vocabResult.error)
        { LOG.error(vocabResult.error, LOG.LS.eSYS); this._errorField = 'purpose'; return null; }
        const purpose: number = vocabResult.idVocabulary;

        vocabResult = await this.computeVocabulary(COMMON.eVocabularySetID.eModelUnits, bagitModel.units);
        if (vocabResult.error)
        { LOG.error(vocabResult.error, LOG.LS.eSYS); this._errorField = 'units'; return null; }
        const units: number = vocabResult.idVocabulary;

        return {
            idAssetVersion: 0,
            name: bagitModel.name,
            subtitle: bagitModel.model_subtitle,
            dateCreated: bagitModel.date_created,
            creationMethod,
            modality,
            units,
            purpose,
            directory: bagitModel.directory_path,
            systemCreated: true,
            modelFileType: 0,
            identifiers: [],
            sourceObjects: [],
            derivedObjects: []
        };
    }

    private async extractSceneFromCSV(bagitScene: ScenesCSVFields): Promise<IngestScene | null> {
        return {
            idAssetVersion: 0,
            systemCreated: true,
            name: bagitScene.name,
            subtitle: bagitScene.scene_subtitle,
            approvedForPublication: bagitScene.approved_for_publication !== 'false' && bagitScene.approved_for_publication !== '0',
            posedAndQCd: bagitScene.posed_and_qcd !== 'false' && bagitScene.posed_and_qcd !== '0',
            directory: bagitScene.directory_path,
            identifiers: [],
            referenceModels: [],
            sourceObjects: [],
            derivedObjects: []
        };
    }

    private async computeVocabulary(eVocabSetID: COMMON.eVocabularySetID, term: string): Promise<{ idVocabulary: number, error?: string | null }> {
        const vocabulary: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyBySetAndTerm(eVocabSetID, term); /* istanbul ignore next */
        if (!vocabulary) {
            const error: string = `Unable to locate ${COMMON.eVocabularySetID[eVocabSetID]} ${term}`;
            LOG.error(error, LOG.LS.eSYS);
            return { idVocabulary: 0, error };
        }
        return { idVocabulary: vocabulary.idVocabulary };
    }
}

