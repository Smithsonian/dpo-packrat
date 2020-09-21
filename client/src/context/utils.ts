import { Item, Project, SubjectUnitIdentifier, AssetVersion, Asset, Vocabulary } from '../types/graphql';
import { StateSubject, StateItem, StateProject, IngestionFile, FileUploadStatus, FileId } from './ingestion';

export function parseFileId(id: FileId): number {
    return Number.parseInt(id, 10);
}

export function parseSubjectUnitIdentifierToState(subjectUnitIdentifier: SubjectUnitIdentifier): StateSubject {
    const { idSubject, SubjectName, UnitAbbreviation, IdentifierPublic } = subjectUnitIdentifier;

    return {
        id: idSubject,
        name: SubjectName,
        arkId: IdentifierPublic || '',
        unit: UnitAbbreviation
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

export function parseAssetVersionToState(assetVersion: AssetVersion, asset: Asset, vocabulary: Vocabulary): IngestionFile {
    const { idAssetVersion, StorageSize } = assetVersion;
    const { FileName } = asset;
    const { idVocabulary } = vocabulary;

    const id = String(idAssetVersion);

    return {
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
}
