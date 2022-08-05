/**
 * Utils
 *
 * These are store specific utilities.
 */
import { AssetVersion, IngestFolder, IngestIdentifier, Item, Project, SubjectUnitIdentifier, Vocabulary, IngestionItem, IngestTitle } from '../types/graphql';
import { StateItem, StateProject } from './item';
import { StateFolder, StateIdentifier, SubtitleFields, eSubtitleOption, ModelFields } from './metadata';
import { StateSubject } from './subject';
import { FileId, FileUploadStatus, IngestionFile } from './upload';
import { eVocabularyID } from '@dpo-packrat/common';

export function parseFileId(id: FileId): number {
    return Number.parseInt(id, 10);
}

export function parseSubjectUnitIdentifierToState(subjectUnitIdentifier: SubjectUnitIdentifier): StateSubject {
    const { idSubject, SubjectName, UnitAbbreviation, IdentifierPublic, IdentifierCollection } = subjectUnitIdentifier;

    return {
        id: idSubject,
        name: SubjectName,
        arkId: IdentifierPublic || '',
        unit: UnitAbbreviation,
        collectionId: IdentifierCollection || ''
    };
}

export function isNewItem(id: string): boolean {
    return id.includes('-new-item');
}

export function parseItemToState(item: Item, selected: boolean, position: number): StateItem {
    const { idItem, Name, EntireSubject } = item;
    const id = idItem || `${position}-new-item`;
    return {
        id: String(id),
        entireSubject: EntireSubject,
        subtitle: Name,
        selected,
        // TODO
        idProject: 0,
        projectName: ''
    };
}

export function parseIngestionItemToState(ingestionItem: IngestionItem): StateItem {
    const { idItem, EntireSubject, MediaGroupName, idProject, ProjectName } = ingestionItem;
    return {
        id: String(idItem),
        subtitle: MediaGroupName,
        entireSubject: EntireSubject,
        selected: false,
        idProject,
        projectName: ProjectName
    };
}

export function parseProjectToState(project: Project, selected: boolean): StateProject {
    const { idProject, Name } = project;

    return {
        id: idProject,
        name: Name,
        selected
    };
}

export function parseAssetVersionToState(assetVersion: AssetVersion, vocabulary: Vocabulary,
    idAsset: number | null, updateContext: string | undefined): IngestionFile {
    const { idAssetVersion, StorageSize, FileName, idSOAttachment } = assetVersion;
    const { idVocabulary } = vocabulary;

    const id = String(idAssetVersion);
    const result: IngestionFile = {
        id,
        name: FileName,
        size: StorageSize,
        file: new File([], FileName),
        type: idVocabulary,
        status: FileUploadStatus.COMPLETE,
        progress: 100,
        selected: false,
        cancel: null,
        updateContext
    };
    if (idAsset) result.idAsset = idAsset;
    if (idSOAttachment) result.idSOAttachment = idSOAttachment;
    return result;
}

export function parseIdentifiersToState(identifiers: IngestIdentifier[], defaultIdentifierField: StateIdentifier[]): StateIdentifier[] {
    const parsedIdentifiers = identifiers.map(
        ({ identifier, identifierType, idIdentifier }: IngestIdentifier, index: number): StateIdentifier => ({
            id: index,
            identifier,
            identifierType,
            idIdentifier,
            preferred: false
        })
    );

    const stateIdentifiers = parsedIdentifiers.length ? parsedIdentifiers : defaultIdentifierField;

    return stateIdentifiers;
}

export function parseFoldersToState(folders: IngestFolder[]): StateFolder[] {
    const stateFolders: StateFolder[] = folders.map(({ name, variantType }: IngestFolder, index: number) => ({
        id: index,
        name,
        variantType: variantType as null | number
    }));

    return stateFolders;
}

export function parseSubtitlesToState(titles: IngestTitle): SubtitleFields {
    const { forced, subtitle } = titles;
    const result: SubtitleFields = [];
    // If forced, user is required to use the value from subtitle
    if (forced && subtitle) {
        result.push({ value: subtitle[0] as string, selected: true, subtitleOption: eSubtitleOption.eForced, id: 0 });
        return result;
    }

    if (subtitle) {
        subtitle.forEach((subtitleVal, key) => {
            // Supply "None" as an option
            if (subtitleVal === '<None>') {
                result.push({ value: '', selected: true, subtitleOption: eSubtitleOption.eNone, id: key });
            }
            // User Input
            if (subtitleVal === null) {
                result.push({ value: '', selected: false, subtitleOption: eSubtitleOption.eInput, id: key });
            }
            // Inherited Value
            if (typeof subtitleVal === 'string' && subtitleVal !== '<None>') {
                result.push({ value: subtitleVal, selected: false, subtitleOption: eSubtitleOption.eInherit, id: key });
            }
        });

        // handle selecting in case for empty string inherit and input, which would normally both be unselected
        const hasSelectedOption = result.some((entry) => entry.selected);
        if (!hasSelectedOption) {
            for (let i = 0; i < result.length; i++) {
                if (result[i].subtitleOption === eSubtitleOption.eInherit && result[i].value === '') {
                    result[i].selected = true;
                    break;
                }
            }
        }
    }

    return result;
}

export function enableSceneGenerateCheck(metadata: ModelFields, unitsEntries, purposeEntries, typeEntries ): boolean {
    const { units, purpose, modelFileType } = metadata;
    if (!units || !purpose || !modelFileType) return false;
    
    const eVocabUnitSet = new Set([eVocabularyID.eModelUnitsMillimeter as number, eVocabularyID.eModelUnitsCentimeter, eVocabularyID.eModelUnitsMeter, eVocabularyID.eModelUnitsInch, eVocabularyID.eModelUnitsFoot, eVocabularyID.eModelUnitsYard]);
    const eVocabPurposeSet = new Set([eVocabularyID.eModelPurposeMaster]);
    const eVocabFileTypeSet = new Set([eVocabularyID.eModelFileTypeobj, eVocabularyID.eModelFileTypestl, eVocabularyID.eModelFileTypeply, eVocabularyID.eModelFileTypefbx, eVocabularyID.eModelFileTypewrl, eVocabularyID.eModelFileTypex3d, eVocabularyID.eModelFileTypedae])
    const idVUnitSet = new Set();
    const idVPurposeSet = new Set();
    const idVFileTypeSet = new Set();

    unitsEntries.forEach(entry => {
        if (eVocabUnitSet.has(entry.eVocabID)) idVUnitSet.add(entry.idVocabulary)}
    );
    purposeEntries.forEach(entry => {
        if (eVocabPurposeSet.has(entry.eVocabID)) idVPurposeSet.add(entry.idVocabulary)}
    );
    typeEntries.forEach(entry => {
        if (eVocabFileTypeSet.has(entry.eVocabID)) idVFileTypeSet.add(entry.idVocabulary)}
    );

    const result = idVUnitSet.has(units) && idVPurposeSet.has(purpose) && idVFileTypeSet.has(modelFileType);
    
    return result;
}