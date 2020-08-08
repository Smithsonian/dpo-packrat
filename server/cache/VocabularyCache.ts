/* eslint-disable @typescript-eslint/no-empty-function */
import * as LOG from '../utils/logger';
import { CacheControl } from './CacheControl';
import { Vocabulary, VocabularySet } from '../db';

/** enum used to provide declarative, programmatic access to sorted vocabulary for system-generated vocabulary sets */
export enum eVocabularySetID {
    eCaptureDataCaptureMethod,
    eCaptureDataDatasetType,
    eCaptureDataItemPositionType,
    eCaptureDataFocusType,
    eCaptureDataLightSourceType,
    eCaptureDataBackgroundRemovalMethod,
    eCaptureDataClusterType,
    eCaptureDataFileVariantType,
    eModelCreationMethod,
    eModelModality,
    eModelUnits,
    eModelPurpose,
    eModelGeometryFileModelFileType,
    eModelProcessingActionStepActionMethod,
    eModelUVMapChannelUVMapType,
    eIdentifierIdentifierType,
    eMetadataMetadataSource,
    eWorkflowStepWorkflowStepType,
    eAssetAssetType,
    eNone = -1
}

export enum eVocabularyID {
    eIdentifierIdentifierTypeARK,
    eIdentifierIdentifierTypeUnitCMSID,
    eNone = -1
}

export class VocabularyCache {
    private static singleton: VocabularyCache | null = null;

    private vocabMap:           Map<number, Vocabulary>         = new Map<number, Vocabulary>();        // map of Vocab ID     -> Vocabulary object
    private vocabSetMap:        Map<number, VocabularySet>      = new Map<number, VocabularySet>();     // map of Vocab Set ID -> VocabularySet object
    private vocabSetEntries:    Map<number, Vocabulary[]>       = new Map<number, Vocabulary[]>();      // map of Vocab Set ID -> Sorted Array of Vocabulary objects

    private vocabEnumIDMap:     Map<eVocabularyID, number>      = new Map<eVocabularyID, number>();     // map of Vocab ID Enum -> Vocab ID
    private vocabIDEnumMap:     Map<number, eVocabularyID>      = new Map<number, eVocabularyID>();     // map of Vocab ID -> Vocab ID Enum

    private vocabSetEnumIDMap:  Map<eVocabularySetID, number>   = new Map<eVocabularySetID, number>();  // map of Vocab Set ID Enum -> Vocab Set ID
    private vocabSetIDEnumMap:  Map<number, eVocabularySetID>   = new Map<number, eVocabularySetID>();  // map of Vocab Set ID -> Vocab Set ID Enum

    // **************************
    // Boilerplate Implementation
    // **************************
    private constructor() { }

    private async flushInternal(): Promise<void> {
        for (let nTry: number = 1; nTry <= CacheControl.cacheBuildTries; nTry++) {
            /* istanbul ignore else */
            if (await this.flushInternalWorker())
                break;
        }
    }

    private static async getInstance(): Promise<VocabularyCache> {
        if (!VocabularyCache.singleton) {
            VocabularyCache.singleton = new VocabularyCache();
            await VocabularyCache.singleton.flushInternal();
        }
        return VocabularyCache.singleton;
    }

    // **************************
    // Cache Construction
    // **************************
    private async flushInternalWorker(): Promise<boolean> {
        LOG.logger.info('CACHE: VocabularyCache.flushInternalWorker() start');
        const vocabArray: Vocabulary[] | null = await Vocabulary.fetchAll();
        /* istanbul ignore if */
        if (!vocabArray)
            return false;
        const vocabSetArray: VocabularySet[] | null = await VocabularySet.fetchAll();
        /* istanbul ignore if */
        if (!vocabSetArray)
            return false;

        for (const vocabularySet of vocabSetArray) {
            this.vocabSetMap.set(vocabularySet.idVocabularySet, vocabularySet);
            this.vocabSetEntries.set(vocabularySet.idVocabularySet, []);

            let eVocabSetEnum: eVocabularySetID = eVocabularySetID.eNone;
            switch (vocabularySet.Name) {
                case 'CaptureData.CaptureMethod':               eVocabSetEnum = eVocabularySetID.eCaptureDataCaptureMethod; break;
                case 'CaptureData.DatasetType':                 eVocabSetEnum = eVocabularySetID.eCaptureDataDatasetType; break;
                case 'CaptureData.ItemPositionType':            eVocabSetEnum = eVocabularySetID.eCaptureDataItemPositionType; break;
                case 'CaptureData.FocusType':                   eVocabSetEnum = eVocabularySetID.eCaptureDataFocusType; break;
                case 'CaptureData.LightSourceType':             eVocabSetEnum = eVocabularySetID.eCaptureDataLightSourceType; break;
                case 'CaptureData.BackgroundRemovalMethod':     eVocabSetEnum = eVocabularySetID.eCaptureDataBackgroundRemovalMethod; break;
                case 'CaptureData.ClusterType':                 eVocabSetEnum = eVocabularySetID.eCaptureDataClusterType; break;
                case 'CaptureDataFile.VariantType':             eVocabSetEnum = eVocabularySetID.eCaptureDataFileVariantType; break;
                case 'Model.CreationMethod':                    eVocabSetEnum = eVocabularySetID.eModelCreationMethod; break;
                case 'Model.Modality':                          eVocabSetEnum = eVocabularySetID.eModelModality; break;
                case 'Model.Units':                             eVocabSetEnum = eVocabularySetID.eModelUnits; break;
                case 'Model.Purpose':                           eVocabSetEnum = eVocabularySetID.eModelPurpose; break;
                case 'ModelGeometryFile.ModelFileType':         eVocabSetEnum = eVocabularySetID.eModelGeometryFileModelFileType; break;
                case 'ModelProcessingActionStep.ActionMethod':  eVocabSetEnum = eVocabularySetID.eModelProcessingActionStepActionMethod; break;
                case 'ModelUVMapChannel.UVMapType':             eVocabSetEnum = eVocabularySetID.eModelUVMapChannelUVMapType; break;
                case 'Identifier.IdentifierType':               eVocabSetEnum = eVocabularySetID.eIdentifierIdentifierType; break;
                case 'Metadata.MetadataSource':                 eVocabSetEnum = eVocabularySetID.eMetadataMetadataSource; break;
                case 'WorkflowStep.WorkflowStepType':           eVocabSetEnum = eVocabularySetID.eWorkflowStepWorkflowStepType; break;
                case 'Asset.AssetType':                         eVocabSetEnum = eVocabularySetID.eAssetAssetType; break;
            }

            if (eVocabSetEnum != eVocabularySetID.eNone) {
                this.vocabSetEnumIDMap.set(eVocabSetEnum, vocabularySet.idVocabularySet);
                this.vocabSetIDEnumMap.set(vocabularySet.idVocabularySet, eVocabSetEnum);
            }
        }

        for (const vocabulary of vocabArray) {
            this.vocabMap.set(vocabulary.idVocabulary, vocabulary);

            let eVocabEnum: eVocabularyID = eVocabularyID.eNone;
            switch (this.vocabSetIDEnumMap.get(vocabulary.idVocabularySet)) {
                case eVocabularySetID.eIdentifierIdentifierType:
                    switch (vocabulary.Term) {
                        case 'ARK':         eVocabEnum = eVocabularyID.eIdentifierIdentifierTypeARK; break;
                        case 'Unit CMS ID': eVocabEnum = eVocabularyID.eIdentifierIdentifierTypeUnitCMSID; break;
                    }
            }

            if (eVocabEnum != eVocabularyID.eNone) {
                this.vocabEnumIDMap.set(eVocabEnum, vocabulary.idVocabulary);
                this.vocabIDEnumMap.set(vocabulary.idVocabulary, eVocabEnum);
            }

            const vocabEntryArray: Vocabulary[] | undefined = this.vocabSetEntries.get(vocabulary.idVocabularySet);
            /* istanbul ignore else */
            if (vocabEntryArray)
                vocabEntryArray.push(vocabulary);
            else {
                LOG.logger.error('VocabularyCache.flushInternalWorker() encountered invalid VocabularySet ID [' +
                    vocabulary.idVocabularySet + '] in vocabulary object ID [' + vocabulary.idVocabularySet + ']');
                continue;
            }
        }

        // Now sort this.vocabSetMap entries
        for (const vocabList of this.vocabSetEntries.values())
            vocabList.sort((vocab1, vocab2) => vocab1.SortOrder - vocab2.SortOrder);

        LOG.logger.info('CACHE: VocabularyCache.flushInternalWorker() done');
        return true;
    }

    // **************************
    // Private Interface
    // **************************
    private vocabularyInternal(idVocabulary: number): Vocabulary | undefined {
        return this.vocabMap.get(idVocabulary);
    }

    private vocabularyByEnumInternal(eVocabEnum: eVocabularyID): Vocabulary | undefined {
        const idVocabulary: number | undefined = this.vocabEnumIDMap.get(eVocabEnum);
        return idVocabulary ? this.vocabularyInternal(idVocabulary) : undefined;
    }

    private vocabularySetInternal(idVocabularySet: number): VocabularySet | undefined {
        return this.vocabSetMap.get(idVocabularySet);
    }

    private vocabularySetByEnumInternal(eVocabSetEnum: eVocabularySetID): VocabularySet | undefined {
        const idVocabularySet: number | undefined = this.vocabSetEnumIDMap.get(eVocabSetEnum);
        return idVocabularySet ? this.vocabularySetInternal(idVocabularySet) : undefined;
    }

    private vocabularySetEntriesInternal(idVocabularySet: number): Vocabulary[] | undefined {
        return this.vocabSetEntries.get(idVocabularySet);
    }

    private vocabularySetEntriesByEnumInternal(eVocabSetID: eVocabularySetID): Vocabulary[] | undefined {
        const idVocabularySet: number | undefined = this.vocabSetEnumIDMap.get(eVocabSetID);
        return idVocabularySet ? this.vocabSetEntries.get(idVocabularySet) : undefined;
    }

    // **************************
    // Public Interface
    // **************************
    /**
     * Fetch vocabulary from cache
     * @param {number} idVocabulary - Vocabulary ID
     */
    static async vocabulary(idVocabulary: number): Promise<Vocabulary | undefined> {
        return (await this.getInstance()).vocabularyInternal(idVocabulary);
    }

    /**
     * Fetch vocabulary from cache by enum
     * @param {eVocabularyID} eVocabEnum - Vocabulary Enum
     */
    static async vocabularyByEnum(eVocabEnum: eVocabularyID): Promise<Vocabulary | undefined> {
        return (await this.getInstance()).vocabularyByEnumInternal(eVocabEnum);
    }

    /**
     * Fetch vocabulary set from cache
     * @param {number} idVocabularySet - Vocabulary Set ID
     */
    static async vocabularySet(idVocabularySet: number): Promise<VocabularySet | undefined> {
        return (await this.getInstance()).vocabularySetInternal(idVocabularySet);
    }

    /**
     * Fetch vocabulary set from cache by enum
     * @param {eVocabularySetID} eVocabSetEnum - Vocabulary Set Enum
     */
    static async vocabularySetByEnum(eVocabSetEnum: eVocabularySetID): Promise<VocabularySet | undefined> {
        return (await this.getInstance()).vocabularySetByEnumInternal(eVocabSetEnum);
    }

    /**
     * Fetch a vocabulary set's sorted vocabulary array from cache
     * @param {number} idVocabularySet - Vocabulary Set ID
     */
    static async vocabularySetEntries(idVocabularySet: number): Promise<Vocabulary[] | undefined> {
        return (await this.getInstance()).vocabularySetEntriesInternal(idVocabularySet);
    }

    /**
     * Fetch a vocabulary set's sorted vocabulary array from cache by vocabulary set enum
     * @param {eVocabularySetID} eVocabSetID - Vocabulary Set ID by enum
     */
    static async vocabularySetEntriesByEnum(eVocabSetID: eVocabularySetID): Promise<Vocabulary[] | undefined> {
        return (await this.getInstance()).vocabularySetEntriesByEnumInternal(eVocabSetID);
    }

    static async flush(): Promise<void> {
        VocabularyCache.singleton = null;
        await this.getInstance();
    }

    static async clear(): Promise<void> {
        VocabularyCache.singleton = null;
    }
}
