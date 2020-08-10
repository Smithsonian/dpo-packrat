import { Item, Project, SubjectUnitIdentifier } from '../types/graphql';
import { StateSubject, StateItem, StateProject } from './ingestion';

export function parseSubjectUnitIdentifierToState(subjectUnitIdentifier: SubjectUnitIdentifier): StateSubject {
    const { idSubject, SubjectName, UnitAbbreviation, IdentifierPublic } = subjectUnitIdentifier;

    return {
        id: idSubject,
        name: SubjectName,
        arkId: IdentifierPublic,
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
