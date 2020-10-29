/**
 * Utils
 *
 * These are store specific utilities.
 */
import { Item, Project, SubjectUnitIdentifier, AssetVersion, Vocabulary } from '../types/graphql';
import { StateSubject } from './subject';
import { StateItem } from './item';
import { StateProject } from './project';
import { IngestionFile, FileUploadStatus, FileId } from './upload';

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

export function parseAssetVersionToState(assetVersion: AssetVersion, vocabulary: Vocabulary): IngestionFile {
    const { idAssetVersion, StorageSize, FileName } = assetVersion;
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
