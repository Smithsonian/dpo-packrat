import { Item, Project, SubjectUnitIdentifier, AssetVersion, Asset, Vocabulary } from '../types/graphql';
import { StateSubject, StateItem, StateProject, IngestionFile, FileUploadStatus, FileId } from './ingestion';

export function generateBagitId(id: FileId, unique: number | string): FileId {
    return `${id}-bagit-${unique}`;
}

export function parseFileId(id: FileId): number {
    const [fileId] = id.split('-bagit-');
    return Number.parseInt(fileId, 10);
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

export function parseItemToState(item: Item, selected: boolean): StateItem {
    const { idItem, Name, EntireSubject } = item;

    return {
        id: String(idItem),
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
