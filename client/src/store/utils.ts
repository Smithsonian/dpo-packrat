/**
 * Utils
 *
 * These are store specific utilities.
 */
import { AssetVersion, IngestFolder, IngestIdentifier, Item, Project, SubjectUnitIdentifier, Vocabulary } from '../types/graphql';
import { StateItem } from './item';
import { StateFolder, StateIdentifier } from './metadata';
import { StateProject } from './project';
import { StateSubject } from './subject';
import { FileId, FileUploadStatus, IngestionFile } from './upload';

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
        name: Name,
        selected
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

export function parseAssetVersionToState(assetVersion: AssetVersion, vocabulary: Vocabulary, idAsset: number | null = null): IngestionFile {
    const { idAssetVersion, StorageSize, FileName } = assetVersion;
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
        cancel: null
    };
    if (idAsset) result.idAsset = idAsset;
    return result;
}

export function parseIdentifiersToState(identifiers: IngestIdentifier[], defaultIdentifierField: StateIdentifier[]): StateIdentifier[] {
    const parsedIdentifiers = identifiers.map(
        ({ identifier, identifierType, idIdentifier }: IngestIdentifier, index: number): StateIdentifier => ({
            id: index,
            identifier,
            identifierType,
            selected: true,
            idIdentifier
        })
    );

    const stateIdentifiers = parsedIdentifiers.length ? parsedIdentifiers : defaultIdentifierField;

    return stateIdentifiers;
}

export function parseFoldersToState(folders: IngestFolder[]): StateFolder[] {
    const stateFolders: StateFolder[] = folders.map(({ name, variantType }: IngestFolder, index: number) => ({
        id: index,
        name,
        variantType
    }));

    return stateFolders;
}
