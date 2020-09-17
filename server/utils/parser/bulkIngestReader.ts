/* eslint-disable camelcase */
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as STORE from '../../storage/interface';
import * as H from '../helpers';
import * as LOG from '../logger';
import { IngestPhotogrammetry, IngestFolder } from '../../types/graphql';
import { IZip } from '../IZip';
import { CSVTypes, SubjectsCSVFields, ItemsCSVFields, CaptureDataPhotoCSVFields, ModelsCSVFields } from './csvTypes';
import { CSVParser } from './csvParser';

/** Wraps a bagit file represented by an AssetVersion. Besides being a valid bagit file (and thus having manifests and declaration files),
 * our bulk ingest files can have any of the following metadata CSV files:
 * subjects.csv: specifies one or more subjects to which the ingested content is attached. An idSubject can be specified to connect to an
 *      existing subject in the Packrat database; otherwise, upon ingest, subject(s) will be created, connected to the EDAN record specified
 *      via guids in the import file.
 * items.csv: specifies exactly one item to which the ingested content is attached. An idItem can be specified to connect to an existing
 *      item in the Packrat database; otherwise, upon ingest, an item will be created.
 * capture_data_photo.csv: specifies photogrammetry capture set metadata, as well as the directory name in which the actual assets
 *      are found within the data folder of the bagit collection
 * models.csv: specifies model metadata, as well as the directory name in which the actual assets are found
 *      within the data folder of the bagit collection
 */
export class BulkIngestReader {
    private _zip: IZip | null = null;

    private _subjects: DBAPI.SubjectUnitIdentifier[] = [];
    private _items: DBAPI.Item[] = [];
    private _captureDataPhotos: IngestPhotogrammetry[] = [];
    private _models: DBAPI.Model[] = [];
    private _projects: DBAPI.Project[] = [];

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
        if (!this._zip)
            return { success: false, error: 'bulkIngestReader.extractMetadata called with invalid zip' };

        const results = await this.extractMetadataWorker();

        if (autoClose) {
            const resultsClose = await this._zip.close();
            this._zip = null;
            return results.success ? resultsClose : results;
        } else
            return results;
    }

    private async extractMetadataWorker(): Promise<H.IOResults> {
        if (!this._zip)
            return { success: false, error: 'bulkIngestReader.extractMetadata called with invalid zip' };

        // extract metadata for capture data

        let results: H.IOResults;
        let readStream: NodeJS.ReadableStream | null = await this._zip.streamContent('capture_data_photo.csv');
        if (readStream) {
            results = await this.computeCaptureDataPhotos(readStream);
            if (!results.success)
                return results;
        }

        // extract metadata for models
        readStream = await this._zip.streamContent('models.csv');
        if (readStream) {
            results = await this.computeModels(readStream);
            if (!results.success)
                return results;
        }

        await this.computeProjects();
        return { success: true, error: '' };
    }

    async close(): Promise<H.IOResults> {
        if (!this._zip)
            return { success: true, error: '' };

        const res = await this._zip.close();
        this._zip = null;
        return res;
    }

    get subjects(): DBAPI.SubjectUnitIdentifier[] {
        return this._subjects;
    }
    get items(): DBAPI.Item[] {
        return this._items;
    }
    get projects(): DBAPI.Project[] {
        return this._projects;
    }
    get captureDataPhoto(): IngestPhotogrammetry[] {
        return this._captureDataPhotos;
    }
    get models(): DBAPI.Model[] {
        return this._models;
    }

    private async computeProjects(): Promise<void> {
        const idSubjects: number[] = [];
        for (const SUI of this._subjects) {
            if (SUI.idSubject)
                idSubjects.push(SUI.idSubject);
        }
        const projectList1: DBAPI.Project[] | null = await DBAPI.Project.fetchDerivedFromSubjectsUnits(idSubjects) || [];
        const projectList2: DBAPI.Project[] | null = await DBAPI.Project.fetchMasterFromSubjects(idSubjects) || [];
        this._projects =  projectList1.concat(projectList2);
    }

    private async computeCaptureDataPhotos(fileStream: NodeJS.ReadableStream): Promise<H.IOResults> {
        let bagitCDPs: (SubjectsCSVFields & ItemsCSVFields & CaptureDataPhotoCSVFields)[];
        try {
            bagitCDPs = await CSVParser.parse<SubjectsCSVFields & ItemsCSVFields & CaptureDataPhotoCSVFields>(fileStream, CSVTypes.captureDataPhoto);
        } catch (error) {
            // LOG.logger.info('bulkIngestReader.computeCaptureDataPhotos capture_data_photos.csv not found');
            return { success: true, error: '' };
        }

        let results: H.IOResults;
        for (const bagitCDP of bagitCDPs) {
            results = await this.extractSubjectFromCSV(bagitCDP);
            if (!results.success)
                return results;

            results = await this.extractItemFromCSV(bagitCDP);
            if (!results.success)
                return results;

            results = await this.extractCaptureDataPhotoFromCSV(bagitCDP);
            if (!results.success)
                return results;
        }
        return { success: true, error: '' };
    }

    private async computeModels(fileStream: NodeJS.ReadableStream): Promise<H.IOResults> {
        let bagitModels: (SubjectsCSVFields & ItemsCSVFields & ModelsCSVFields)[];
        try {
            bagitModels = await CSVParser.parse<SubjectsCSVFields & ItemsCSVFields & ModelsCSVFields>(fileStream, CSVTypes.models);
        } catch (error) {
            // LOG.logger.info('bulkIngestReader.computeCaptureDataPhotos models.csv not found');
            return { success: true, error: '' };
        }

        let results: H.IOResults;
        for (const bagitModel of bagitModels) {
            results = await this.extractSubjectFromCSV(bagitModel);
            if (!results.success)
                return results;

            results = await this.extractItemFromCSV(bagitModel);
            if (!results.success)
                return results;

            results = await this.extractModelFromCSV(bagitModel);
            if (!results.success)
                return results;
        }
        return { success: true, error: '' };
    }

    private async extractSubjectFromCSV(bagitSubject: SubjectsCSVFields): Promise<H.IOResults> {
        // try to load from guid as a subject identifier
        const identifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromIdentifierValue(bagitSubject.subject_guid);
        if (identifiers) {
            for (const identifier of identifiers) {
                if (!identifier.idSystemObject)
                    continue;
                const SOPair: DBAPI.SystemObjectPairs | null = await DBAPI.SystemObjectPairs.fetch(identifier.idSystemObject);
                if (SOPair && SOPair.Subject) {
                    const SUID: DBAPI.SubjectUnitIdentifier | null = await this.extractSubjectUnitIDFromSubject(SOPair.Subject, bagitSubject);
                    if (SUID) {
                        this._subjects.push(SUID);
                        return { success: true, error: '' };
                    }
                }
            }
        }

        // otherwise, we can't spot this subject in our DB; validate unit name and then gather remaining information
        const units: DBAPI.Unit[] | null = await DBAPI.Unit.fetchFromNameSearch(bagitSubject.unit_name);
        if (!units || units.length == 0) {
            const error: string = `BulkIngestReader.computeCaptureDataPhotos unable to load unit from ${JSON.stringify(bagitSubject)}`;
            LOG.logger.error(error);
            return { success: false, error };
        }

        this.subjects.push({ idSubject: 0, SubjectName: bagitSubject.subject_name, UnitAbbreviation: units[0].Abbreviation || '',
            IdentifierCollection: bagitSubject.subject_guid, IdentifierPublic: '' });
        return { success: true, error: '' };
    }

    private async extractSubjectUnitIDFromSubject(subject: DBAPI.Subject | null,
        bagitSubject: SubjectsCSVFields): Promise<DBAPI.SubjectUnitIdentifier | null> {
        if (!subject) {
            LOG.logger.error(`BulkIngestReader.extractSubjectUnitIDFromSubject unable to load subject from local_subject_id in ${JSON.stringify(bagitSubject)}`);
            return null;
        }
        const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(subject.idUnit);
        if (!unit) {
            LOG.logger.error(`BulkIngestReader.extractSubjectUnitIDFromSubject unable to load unit from local_subject_id in ${JSON.stringify(bagitSubject)}`);
            return null;
        }

        const identifier: DBAPI.Identifier | null = (subject.idIdentifierPreferred)
            ? await DBAPI.Identifier.fetch(subject.idIdentifierPreferred)
            : null;
        return { idSubject: subject.idSubject, SubjectName: subject.Name, UnitAbbreviation: unit.Abbreviation  || '',
            IdentifierCollection: identifier ? identifier.IdentifierValue : bagitSubject.subject_guid, IdentifierPublic: '' };
    }

    private async extractItemFromCSV(bagitItem: ItemsCSVFields): Promise<H.IOResults> {
        // try to load from guid as a item identifier
        if (!bagitItem.item_guid) {
            this._items.push(new DBAPI.Item({
                idItem: 0,
                EntireSubject: bagitItem.entire_subject != 0,
                idAssetThumbnail!: null,
                idGeoLocation!: null,
                Name: bagitItem.item_name
            }));
            return { success: true, error: '' };
        }

        const error: string = `Unable to find identifiers for items from ${bagitItem.item_guid}`;
        const identifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromIdentifierValue(bagitItem.item_guid);
        if (!identifiers) {
            LOG.logger.error(error);
            return { success: false, error };
        }

        for (const identifier of identifiers) {
            if (!identifier.idSystemObject)
                continue;
            const SOPair: DBAPI.SystemObjectPairs | null = await DBAPI.SystemObjectPairs.fetch(identifier.idSystemObject);
            if (SOPair && SOPair.Item) {
                this._items.push(SOPair.Item);
                return { success: true, error: '' };
            } else {
                LOG.logger.error(error);
                return { success: false, error };
            }
        }

        LOG.logger.error(error);
        return { success: false, error };
    }

    private async extractCaptureDataPhotoFromCSV(bagitCDP: CaptureDataPhotoCSVFields): Promise<H.IOResults> {
        let vocabResult: { idVocabulary: number, error?: string | null };

        vocabResult = await this.computeVocabulary(CACHE.eVocabularySetID.eCaptureDataDatasetType, bagitCDP.capture_dataset_type);
        if (vocabResult.error)
            return { success: false, error: vocabResult.error };
        const datasetType: number = vocabResult.idVocabulary;

        vocabResult = await this.computeVocabulary(CACHE.eVocabularySetID.eCaptureDataItemPositionType, bagitCDP.item_position_type);
        if (vocabResult.error)
            return { success: false, error: vocabResult.error };
        const itemPositionType: number = vocabResult.idVocabulary;

        vocabResult = await this.computeVocabulary(CACHE.eVocabularySetID.eCaptureDataFocusType, bagitCDP.focus_type);
        if (vocabResult.error)
            return { success: false, error: vocabResult.error };
        const focusType: number = vocabResult.idVocabulary;

        vocabResult = await this.computeVocabulary(CACHE.eVocabularySetID.eCaptureDataLightSourceType, bagitCDP.light_source_type);
        if (vocabResult.error)
            return { success: false, error: vocabResult.error };
        const lightsourceType: number = vocabResult.idVocabulary;

        vocabResult = await this.computeVocabulary(CACHE.eVocabularySetID.eCaptureDataBackgroundRemovalMethod, bagitCDP.background_removal_method);
        if (vocabResult.error)
            return { success: false, error: vocabResult.error };
        const backgroundRemovalMethod: number = vocabResult.idVocabulary;

        vocabResult = await this.computeVocabulary(CACHE.eVocabularySetID.eCaptureDataClusterType, bagitCDP.cluster_type);
        if (vocabResult.error)
            return { success: false, error: vocabResult.error };
        const clusterType: number = vocabResult.idVocabulary;

        const folders: IngestFolder[] = [];
        if (this._zip) {
            const directories: string[] = await this._zip.getJustDirectories();
            for (const directory of directories) {
                if (directory.toLowerCase().includes(bagitCDP.directory_path.toLowerCase())) {
                    const vocabulary: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapPhotogrammetryVariantType(directory);
                    folders.push({ name: directory, variantType: vocabulary ? vocabulary.idVocabulary : 0 });
                }
            }
        }

        // directory_path: string;
        const captureDataPhoto: IngestPhotogrammetry = {
            idAssetVersion: 0, // TODO: not sure what is needed here
            systemCreated: true, // TODO: not sure what is needed here
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
            clusterGeometryFieldId: bagitCDP.cluster_geometry_field_id
        };
        this._captureDataPhotos.push(captureDataPhoto);
        return { success: true, error: '' };
    }

    private async extractModelFromCSV(bagitModel: ModelsCSVFields): Promise<H.IOResults> {
        let vocabResult: { idVocabulary: number, error?: string | null };

        vocabResult = await this.computeVocabulary(CACHE.eVocabularySetID.eModelCreationMethod, bagitModel.creation_method);
        if (vocabResult.error)
            return { success: false, error: vocabResult.error };
        const idVCreationMethod: number = vocabResult.idVocabulary;

        vocabResult = await this.computeVocabulary(CACHE.eVocabularySetID.eModelModality, bagitModel.modality);
        if (vocabResult.error)
            return { success: false, error: vocabResult.error };
        const idVModality: number = vocabResult.idVocabulary;

        vocabResult = await this.computeVocabulary(CACHE.eVocabularySetID.eModelPurpose, bagitModel.purpose);
        if (vocabResult.error)
            return { success: false, error: vocabResult.error };
        const idVPurpose: number = vocabResult.idVocabulary;

        vocabResult = await this.computeVocabulary(CACHE.eVocabularySetID.eModelUnits, bagitModel.units);
        if (vocabResult.error)
            return { success: false, error: vocabResult.error };
        const idVUnits: number = vocabResult.idVocabulary;

        // directory_path: string;
        const model: DBAPI.Model = new DBAPI.Model({
            idModel: 0, // TODO: not sure what is needed here
            Authoritative: bagitModel.authoritative != 0,
            DateCreated: H.Helpers.convertStringToDate(bagitModel.date_created) || new Date(),
            idAssetThumbnail: null,
            idVCreationMethod,
            idVModality,
            idVPurpose,
            idVUnits,
            Master: bagitModel.master != 0
        });
        this._models.push(model);
        return { success: true, error: '' };
    }

    private async computeVocabulary(eVocabSetID: CACHE.eVocabularySetID, term: string): Promise<{ idVocabulary: number, error?: string | null }> {
        const vocabulary: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyBySetAndTerm(eVocabSetID, term);
        if (!vocabulary) {
            const error: string = `Unable to locate ${CACHE.eVocabularySetID[eVocabSetID]} ${term}`;
            LOG.logger.error(error);
            return { idVocabulary: 0, error };
        }
        return { idVocabulary: vocabulary.idVocabulary };
    }
}

