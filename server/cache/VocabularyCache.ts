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
    eNone = -1
}

export class VocabularyCache {
    private static singleton: VocabularyCache | null = null;

    private vocabMap:           Map<number, Vocabulary>         = new Map<number, Vocabulary>();        // map of Vocab ID     -> Vocabulary object
    private vocabSetMap:        Map<number, VocabularySet>      = new Map<number, VocabularySet>();     // map of Vocab Set ID -> VocabularySet object
    private vocabSetEntries:    Map<number, Vocabulary[]>       = new Map<number, Vocabulary[]>();      // map of Vocab Set ID -> Sorted Array of Vocabulary objects
    private vocabSetIDMap:      Map<eVocabularySetID, number>   = new Map<eVocabularySetID, number>();  // map of Vocab Set ID Enum -> Vocab Set ID

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

            let eVocabSetID: eVocabularySetID = eVocabularySetID.eNone;
            switch (vocabularySet.Name) {
                case 'CaptureData.CaptureMethod':               eVocabSetID = eVocabularySetID.eCaptureDataCaptureMethod; break;
                case 'CaptureData.DatasetType':                 eVocabSetID = eVocabularySetID.eCaptureDataDatasetType; break;
                case 'CaptureData.ItemPositionType':            eVocabSetID = eVocabularySetID.eCaptureDataItemPositionType; break;
                case 'CaptureData.FocusType':                   eVocabSetID = eVocabularySetID.eCaptureDataFocusType; break;
                case 'CaptureData.LightSourceType':             eVocabSetID = eVocabularySetID.eCaptureDataLightSourceType; break;
                case 'CaptureData.BackgroundRemovalMethod':     eVocabSetID = eVocabularySetID.eCaptureDataBackgroundRemovalMethod; break;
                case 'CaptureData.ClusterType':                 eVocabSetID = eVocabularySetID.eCaptureDataClusterType; break;
                case 'CaptureDataFile.VariantType':             eVocabSetID = eVocabularySetID.eCaptureDataFileVariantType; break;
                case 'Model.CreationMethod':                    eVocabSetID = eVocabularySetID.eModelCreationMethod; break;
                case 'Model.Modality':                          eVocabSetID = eVocabularySetID.eModelModality; break;
                case 'Model.Units':                             eVocabSetID = eVocabularySetID.eModelUnits; break;
                case 'Model.Purpose':                           eVocabSetID = eVocabularySetID.eModelPurpose; break;
                case 'ModelGeometryFile.ModelFileType':         eVocabSetID = eVocabularySetID.eModelGeometryFileModelFileType; break;
                case 'ModelProcessingActionStep.ActionMethod':  eVocabSetID = eVocabularySetID.eModelProcessingActionStepActionMethod; break;
                case 'ModelUVMapChannel.UVMapType':             eVocabSetID = eVocabularySetID.eModelUVMapChannelUVMapType; break;
                case 'Identifier.IdentifierType':               eVocabSetID = eVocabularySetID.eIdentifierIdentifierType; break;
                case 'Metadata.MetadataSource':                 eVocabSetID = eVocabularySetID.eMetadataMetadataSource; break;
                case 'WorkflowStep.WorkflowStepType':           eVocabSetID = eVocabularySetID.eWorkflowStepWorkflowStepType; break;
            }

            if (eVocabSetID != eVocabularySetID.eNone)
                this.vocabSetIDMap.set(eVocabSetID, vocabularySet.idVocabularySet);
        }

        for (const vocabulary of vocabArray) {
            this.vocabMap.set(vocabulary.idVocabulary, vocabulary);

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

    private vocabularySetInternal(idVocabularySet: number): VocabularySet | undefined {
        return this.vocabSetMap.get(idVocabularySet);
    }

    private vocabularySetEntriesInternal(idVocabularySet: number): Vocabulary[] | undefined {
        return this.vocabSetEntries.get(idVocabularySet);
    }

    private vocabularySetEntriesByEnumInternal(eVocabSetID: eVocabularySetID): Vocabulary[] | undefined {
        const idVocabularySet: number | undefined = this.vocabSetIDMap.get(eVocabSetID);
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
     * Fetch vocabulary set from cache
     * @param {number} idVocabularySet - Vocabulary Set ID
     */
    static async vocabularySet(idVocabularySet: number): Promise<VocabularySet | undefined> {
        return (await this.getInstance()).vocabularySetInternal(idVocabularySet);
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
